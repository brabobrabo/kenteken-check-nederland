import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VehicleData } from '@/types/vehicle';

export interface SavedLicense {
  id: string;
  kenteken: string;
  merk: string | null;
  handelsbenaming: string | null;
  apk_vervaldatum: string | null;
  datum_eerste_toelating: string | null;
  wam_verzekerd: string | null;
  geschorst: string | null;
  added_by: string | null;
  added_at: string;
  voertuigsoort: string | null;
  inrichting: string | null;
  aantal_zitplaatsen: number | null;
  eerste_kleur: string | null;
  tweede_kleur: string | null;
  aantal_cilinders: number | null;
  cilinderinhoud: number | null;
  massa_ledig_voertuig: number | null;
  toegestane_maximum_massa_voertuig: number | null;
  massa_rijklaar: number | null;
  maximum_massa_trekken_ongeremd: number | null;
  maximum_massa_trekken_geremd: number | null;
  datum_tenaamstelling: string | null;
  handelsbenaming_uitgebreid: string | null;
  vermogen_massaverhouding: number | null;
  uitstoot_co2_gecombineerd: number | null;
  milieuklasse_eg_goedkeuring_licht: string | null;
  geluidsniveau_stationair: number | null;
  geluidsniveau_rijdend: number | null;
  datumEersteTenaamstellingInNederlandDt: string | null;
  exportIndicator: string | null;
  tenaamstellenMogelijk: string | null;
}

export const useSavedLicenses = () => {
  const [savedLicenses, setSavedLicenses] = useState<SavedLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSavedLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_licenses')
        .select(`
          id,
          kenteken,
          merk,
          handelsbenaming,
          apk_vervaldatum,
          datum_eerste_toelating,
          wam_verzekerd,
          geschorst,
          added_by,
          added_at,
          voertuigsoort,
          inrichting,
          aantal_zitplaatsen,
          eerste_kleur,
          tweede_kleur,
          aantal_cilinders,
          cilinderinhoud,
          massa_ledig_voertuig,
          toegestane_maximum_massa_voertuig,
          massa_rijklaar,
          maximum_massa_trekken_ongeremd,
          maximum_massa_trekken_geremd,
          datum_tenaamstelling,
          handelsbenaming_uitgebreid,
          vermogen_massaverhouding,
          uitstoot_co2_gecombineerd,
          milieuklasse_eg_goedkeuring_licht,
          geluidsniveau_stationair,
          geluidsniveau_rijdend,
          export_indicator,
          tenaamstellen_mogelijk
        `)
        .order('added_at', { ascending: false });

      if (error) throw error;
      
      // Map the database data to include the new properties
      const mappedData = (data || []).map(item => ({
        ...item,
        datumEersteTenaamstellingInNederlandDt: item.datum_tenaamstelling || null,
        exportIndicator: item.export_indicator || 'Unknown',
        tenaamstellenMogelijk: item.tenaamstellen_mogelijk || 'Unknown'
      }));
      
      setSavedLicenses(mappedData);
    } catch (error) {
      console.error('Error fetching saved licenses:', error);
      toast.error('Failed to load saved licenses');
    } finally {
      setLoading(false);
    }
  };

  const saveLicense = async (vehicleData: VehicleData, additionalData?: any) => {
    if (!user) {
      toast.error('You must be logged in to save licenses');
      return false;
    }

    try {
      const licenseData = {
        kenteken: vehicleData.kenteken,
        merk: vehicleData.merk,
        handelsbenaming: vehicleData.handelsbenaming,
        apk_vervaldatum: vehicleData.apkVervaldatum,
        datum_eerste_toelating: vehicleData.datumEersteToelating,
        wam_verzekerd: vehicleData.wamVerzekerd,
        geschorst: vehicleData.geschorst,
        datum_tenaamstelling: vehicleData.datumTenaamstelling,
        export_indicator: vehicleData.exportIndicator,
        tenaamstellen_mogelijk: vehicleData.tenaamstellenMogelijk,
        added_by: user.id,
        ...additionalData
      };

      const { error } = await supabase
        .from('saved_licenses')
        .insert([licenseData]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('This license plate is already saved');
          return false;
        }
        throw error;
      }

      toast.success('License plate saved successfully');
      fetchSavedLicenses(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error saving license:', error);
      toast.error('Failed to save license plate');
      return false;
    }
  };

  const deleteLicense = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete licenses');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('License plate removed');
      fetchSavedLicenses(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error('Failed to remove license plate');
      return false;
    }
  };

  const bulkDeleteLicenses = async (ids: string[]) => {
    if (!user) {
      toast.error('You must be logged in to delete licenses');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_licenses')
        .delete()
        .in('id', ids)
        .eq('added_by', user.id); // Only allow deletion of user's own licenses

      if (error) throw error;

      toast.success(`${ids.length} license plates removed`);
      fetchSavedLicenses(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error bulk deleting licenses:', error);
      toast.error('Failed to remove license plates');
      return false;
    }
  };

  const isLicenseSaved = (kenteken: string) => {
    return savedLicenses.some(license => license.kenteken === kenteken);
  };

  useEffect(() => {
    if (user) {
      fetchSavedLicenses();
    }
  }, [user]);

  return {
    savedLicenses,
    loading,
    saveLicense,
    deleteLicense,
    bulkDeleteLicenses,
    isLicenseSaved,
    fetchSavedLicenses
  };
};
