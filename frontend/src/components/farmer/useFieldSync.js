import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Custom hook to sync field and crop data across components
 * Automatically updates crop management when field management changes and vice versa
 */
export const useFieldSync = () => {
  const [syncedFields, setSyncedFields] = useState([]);
  const [syncedCrops, setSyncedCrops] = useState([]);
  const token = localStorage.getItem('token');

  // Fetch and sync field data
  const fetchSyncedFields = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/fields', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyncedFields(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error('Error fetching fields:', err);
      return [];
    }
  };

  // Fetch and sync crop data
  const fetchSyncedCrops = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/farmer/crops', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyncedCrops(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error('Error fetching crops:', err);
      return [];
    }
  };

  // Sync initial data
  useEffect(() => {
    if (token) {
      fetchSyncedFields();
      fetchSyncedCrops();
    }
  }, [token]);

  // Convert field to crop for migration
  const fieldToCrop = (field) => {
    // Backend expects Date object, not string
    const sowingDate = field.currentCrop?.plantingDate 
      ? new Date(field.currentCrop.plantingDate)
      : new Date();

    const cropData = {
      category: 'Field Crop', // Required
      name: field.currentCrop?.cropType || field.fieldName, // Required - crop name
      area: Number(field.areaInHectares), // Required - ensure number type
      unit: 'Hectare', // Required - must match Crop schema enum
      method: 'Direct sowing', // Required
      season: getCurrentSeason(), // Required - must match Crop schema enum
      sowingDate: sowingDate, // Required - send as Date object for backend
      stage: 'Land Preparation', // Always start at stage 1 for synced crops
      days: 0,
      notes: `Migrated from Field: ${field.fieldName} (${field.fieldCode})`,
      fieldId: field._id // Reference back to source field
    };
    
    // Include location info for syncing to crop management map - ensure coordinates array is valid
    if (field.location?.coordinates && Array.isArray(field.location.coordinates) && field.location.coordinates.length === 2) {
      const [lng, lat] = field.location.coordinates;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        cropData.location = {
          latitude: lat,
          longitude: lng,
          fieldName: field.fieldName
        };
        console.log('Including field location in crop sync:', cropData.location);
      }
    }
    
    return cropData;
  };

  // Convert crop to field
  const cropToField = (crop, location) => {
    const plantingDate = new Date(crop.sowingDate);
    const harvestDate = new Date(plantingDate.getTime() + 120 * 24 * 60 * 60 * 1000);
    
    const fieldData = {
      fieldName: crop.name,
      fieldCode: `CROP-${Date.now()}`,
      areaInHectares: parseFloat(crop.area),
      soilType: 'Mixed',
      status: 'Active',
      currentCrop: {
        cropType: crop.name,
        variety: crop.name,
        plantingDate: plantingDate.toISOString().split('T')[0],
        expectedHarvestDate: harvestDate.toISOString().split('T')[0],
        growthStage: mapCropStageToFieldStage(crop.stage)
      }
    };
    
    // Add location if provided
    if (location?.latitude && location?.longitude) {
      fieldData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      };
    }
    
    return fieldData;
  };
  
  // Map crop stages back to field stages
  const mapCropStageToFieldStage = (cropStage) => {
    const stageMap = {
      'Land Preparation': 'Vegetative',
      'Sowing': 'Seedling',
      'Germination': 'Germination',
      'Vegetative Growth': 'Vegetative',
      'Flowering': 'Flowering',
      'Harvest': 'Fruiting'
    };
    return stageMap[cropStage] || 'Vegetative';
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'Kharif';
    if ((month >= 10 && month <= 12) || month <= 3) return 'Rabi';
    return 'Zaid';
  };

  return {
    syncedFields,
    syncedCrops,
    fetchSyncedFields,
    fetchSyncedCrops,
    fieldToCrop,
    cropToField,
    token
  };
};

export default useFieldSync;
