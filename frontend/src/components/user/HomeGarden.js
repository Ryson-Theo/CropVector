import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import {
  Plus, Edit2, Trash2, AlertTriangle,
  Droplet, Leaf, Lightbulb,
  MapPin, Home, Camera, Beaker, Target, Award,
  BarChart, Bug, Edit, Sprout
} from "lucide-react";
import axios from "axios";
import "./HomeGarden.css";
import "react-toastify/dist/ReactToastify.css";

const HomeGarden = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("zones"); // zones, water, nutrients, lights, alerts, harvest, pests
  const [zones, setZones] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [nutrientRecipes, setNutrientRecipes] = useState([]);
  const [lightSchedules, setLightSchedules] = useState([]);
  const [pestMarks, setPestMarks] = useState([]);
  const [customAlerts, setCustomAlerts] = useState([]);
  const [harvestLogs, setHarvestLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const API_BASE = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Check authentication on component mount
  useEffect(() => {
    if (!token || !userId) {
      toast.error('Please log in to access your home garden');
      navigate('/login');
      return;
    }
  }, [token, userId, navigate]);

  // Load data
  useEffect(() => {
    if (token && userId) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  // Form states
  const [zoneForm, setZoneForm] = useState({
    name: '',
    type: 'Soil-based', // Soil-based, Hydroponic, Aeroponic
    location: 'Balcony', // Rooftop, Indoor, Balcony, Kitchen
    size: '',
    level: '1'
  });

  const [waterForm, setWaterForm] = useState({
    zoneId: '',
    pH: '',
    EC: '',
    temperature: '',
    notes: ''
  });

  const [nutrientForm, setNutrientForm] = useState({
    name: '',
    ingredientA: '',
    ingredientB: '',
    ratioA: '',
    ratioB: '',
    targetCrop: '',
    dosage: ''
  });

  const [lightForm, setLightForm] = useState({
    zoneId: '',
    onTime: '',
    offTime: '',
    photoperiod: '',
    notes: ''
  });

  const [pestForm, setPestForm] = useState({
    pestName: '',
    zone: '',
    severity: 'medium', // low, medium, high
    treatment: ''
  });

  const [alertForm, setAlertForm] = useState({
    zone: '',
    type: 'watering', // watering, health, pest, custom
    message: '',
    frequency: '' // daily, weekly, on-demand
  });

  const [harvestForm, setHarvestForm] = useState({
    cropName: '',
    zone: '',
    plantedDate: '',
    harvestDate: '',
    quantity: '',
    unit: 'kg', // kg, lbs, units, bunches
    notes: '',
    photo: null
  });

  const loadAllData = async () => {
    try {
      // First, load from localStorage immediately for instant UI feedback
      const savedZones = localStorage.getItem('homeGardenZones');
      const savedWaterLogs = localStorage.getItem('homeGardenWaterLogs');
      const savedNutrients = localStorage.getItem('homeGardenNutrients');
      const savedSchedules = localStorage.getItem('homeGardenSchedules');
      const savedPests = localStorage.getItem('homeGardenPests');
      const savedAlerts = localStorage.getItem('homeGardenAlerts');
      const savedHarvests = localStorage.getItem('homeGardenHarvests');

      console.log('LocalStorage data found:', {
        zones: !!savedZones,
        waterLogs: !!savedWaterLogs,
        nutrients: !!savedNutrients,
        schedules: !!savedSchedules,
        pests: !!savedPests,
        alerts: !!savedAlerts,
        harvests: !!savedHarvests
      });

      if (savedZones) {
        const zonesData = JSON.parse(savedZones);
        console.log('Loading zones from localStorage:', zonesData.length, zonesData);
        setZones(zonesData);
      }
      if (savedWaterLogs) {
        const waterData = JSON.parse(savedWaterLogs);
        console.log('Loading water logs from localStorage:', waterData.length);
        setWaterLogs(waterData);
      }
      if (savedNutrients) {
        const nutrientData = JSON.parse(savedNutrients);
        console.log('Loading nutrients from localStorage:', nutrientData.length);
        setNutrientRecipes(nutrientData);
      }
      if (savedSchedules) {
        const scheduleData = JSON.parse(savedSchedules);
        console.log('Loading schedules from localStorage:', scheduleData.length);
        setLightSchedules(scheduleData);
      }
      if (savedPests) {
        const pestData = JSON.parse(savedPests);
        console.log('Loading pests from localStorage:', pestData.length);
        setPestMarks(pestData);
      }
      if (savedAlerts) {
        const alertData = JSON.parse(savedAlerts);
        console.log('Loading alerts from localStorage:', alertData.length);
        setCustomAlerts(alertData);
      }
      if (savedHarvests) {
        const harvestData = JSON.parse(savedHarvests);
        console.log('Loading harvests from localStorage:', harvestData.length);
        setHarvestLogs(harvestData);
      }

      setLoading(true);
      console.log('Loading data... Token:', !!token, 'UserId:', userId);

      if (!token || !userId) {
        console.log('No token or userId, keeping localStorage data');
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      console.log('Making API call to:', `${API_BASE}/home-garden`);
      const response = await axios.get(`${API_BASE}/home-garden`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);
      const data = response.data;

      // Only override localStorage data if backend has actual data
      // If backend is empty but we have localStorage data, keep localStorage data
      if (data.zones && data.zones.length > zones.length) {
        setZones(data.zones);
      }
      if (data.waterLogs && data.waterLogs.length > waterLogs.length) {
        setWaterLogs(data.waterLogs);
      }
      if (data.nutrientRecipes && data.nutrientRecipes.length > nutrientRecipes.length) {
        setNutrientRecipes(data.nutrientRecipes);
      }
      if (data.lightSchedules && data.lightSchedules.length > lightSchedules.length) {
        setLightSchedules(data.lightSchedules);
      }
      if (data.pestMarks && data.pestMarks.length > pestMarks.length) {
        setPestMarks(data.pestMarks);
      }
      if (data.customAlerts && data.customAlerts.length > customAlerts.length) {
        setCustomAlerts(data.customAlerts);
      }
      if (data.harvestLogs && data.harvestLogs.length > harvestLogs.length) {
        setHarvestLogs(data.harvestLogs);
      }

      console.log('Data loaded from backend - zones:', data.zones?.length || 0, 'waterLogs:', data.waterLogs?.length || 0);

      // Try to migrate any localStorage data to backend if backend is empty
      const hasLocalData = savedZones || savedWaterLogs || savedNutrients || savedSchedules || savedPests || savedAlerts || savedHarvests;
      const backendHasData = (data.zones?.length > 0 || data.waterLogs?.length > 0 || data.nutrientRecipes?.length > 0 ||
                             data.lightSchedules?.length > 0 || data.pestMarks?.length > 0 ||
                             data.customAlerts?.length > 0 || data.harvestLogs?.length > 0);

      if (hasLocalData && !backendHasData) {
        console.log('Backend is empty, migrating localStorage data to backend');
        await migrateLocalStorageToBackend();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response?.data);
      // Keep localStorage data if API fails
      toast.error('Failed to sync with server, using local data');
    } finally {
      setLoading(false);
    }
  };

  // Migrate localStorage data to backend on first load
  const migrateLocalStorageToBackend = async () => {
    try {
      const localData = {
        zones: JSON.parse(localStorage.getItem('homeGardenZones') || '[]'),
        waterLogs: JSON.parse(localStorage.getItem('homeGardenWaterLogs') || '[]'),
        nutrientRecipes: JSON.parse(localStorage.getItem('homeGardenNutrients') || '[]'),
        lightSchedules: JSON.parse(localStorage.getItem('homeGardenSchedules') || '[]'),
        pestMarks: JSON.parse(localStorage.getItem('homeGardenPests') || '[]'),
        customAlerts: JSON.parse(localStorage.getItem('homeGardenAlerts') || '[]'),
        harvestLogs: JSON.parse(localStorage.getItem('homeGardenHarvests') || '[]')
      };

      await axios.post(`${API_BASE}/home-garden`, localData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear localStorage after successful migration
      localStorage.removeItem('homeGardenZones');
      localStorage.removeItem('homeGardenWaterLogs');
      localStorage.removeItem('homeGardenNutrients');
      localStorage.removeItem('homeGardenSchedules');
      localStorage.removeItem('homeGardenPests');
      localStorage.removeItem('homeGardenAlerts');
      localStorage.removeItem('homeGardenHarvests');

      toast.success('Data migrated to cloud storage');
    } catch (error) {
      console.error('Error migrating data:', error);
      toast.error('Failed to migrate local data');
    }
  };

  // Helper function to save all data to backend
  const saveAllDataToBackend = async (overrideData = {}) => {
    try {
      const dataToSave = {
        zones,
        waterLogs,
        nutrientRecipes,
        lightSchedules,
        pestMarks,
        customAlerts,
        harvestLogs,
        ...overrideData
      };

      console.log('Saving to backend:', dataToSave);
      await axios.post(`${API_BASE}/home-garden`, dataToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Successfully saved to backend');
    } catch (error) {
      console.error('Error saving data to backend:', error);
      throw error;
    }
  };

  const handleAddZone = async () => {
    if (!zoneForm.name) {
      toast.error('Zone name is required');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing zone
        const updatedZones = zones.map(z => z.id === editingItemId ? { ...z, ...zoneForm, lastUpdated: new Date() } : z);
        setZones(updatedZones);
        localStorage.setItem('homeGardenZones', JSON.stringify(updatedZones));
        await saveAllDataToBackend({ zones: updatedZones });
        toast.success('Zone updated successfully');
      } else {
        // Add new zone
        const newZones = [...zones, { id: Date.now(), ...zoneForm, health: 'good', lastUpdated: new Date() }];
        setZones(newZones);
        localStorage.setItem('homeGardenZones', JSON.stringify(newZones));
        await saveAllDataToBackend({ zones: newZones });
        toast.success('Zone added successfully');
      }
      setZoneForm({ name: '', type: 'Soil-based', location: 'Balcony', size: '', level: '1' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to save zone');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      const updatedZones = zones.filter(z => z.id !== id);
      setZones(updatedZones);
      localStorage.setItem('homeGardenZones', JSON.stringify(updatedZones));
      await saveAllDataToBackend({ zones: updatedZones });
      toast.success('Zone deleted');
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  const handleDeleteWaterLog = async (id) => {
    try {
      const updatedLogs = waterLogs.filter(l => l.id !== id);
      setWaterLogs(updatedLogs);
      localStorage.setItem('homeGardenWaterLogs', JSON.stringify(updatedLogs));
      await saveAllDataToBackend({ waterLogs: updatedLogs });
      toast.success('Water log deleted');
    } catch (error) {
      toast.error('Failed to delete water log');
    }
  };

  const handleDeleteNutrient = async (id) => {
    try {
      const updatedRecipes = nutrientRecipes.filter(r => r.id !== id);
      setNutrientRecipes(updatedRecipes);
      localStorage.setItem('homeGardenNutrients', JSON.stringify(updatedRecipes));
      await saveAllDataToBackend({ nutrientRecipes: updatedRecipes });
      toast.success('Recipe deleted');
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };

  const handleDeleteLight = async (id) => {
    try {
      const updatedSchedules = lightSchedules.filter(s => s.id !== id);
      setLightSchedules(updatedSchedules);
      localStorage.setItem('homeGardenSchedules', JSON.stringify(updatedSchedules));
      await saveAllDataToBackend({ lightSchedules: updatedSchedules });
      toast.success('Schedule deleted');
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleDeletePest = async (id) => {
    try {
      const updatedPests = pestMarks.filter(p => p.id !== id);
      setPestMarks(updatedPests);
      localStorage.setItem('homeGardenPests', JSON.stringify(updatedPests));
      await saveAllDataToBackend({ pestMarks: updatedPests });
      toast.success('Pest record deleted');
    } catch (error) {
      toast.error('Failed to delete pest record');
    }
  };

  const handleAddWaterLog = async () => {
    if (!waterForm.zoneId || !waterForm.pH) {
      toast.error('Fill in required fields');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing water log
        const updatedLogs = waterLogs.map(l => l.id === editingItemId ? { ...l, ...waterForm, timestamp: new Date() } : l);
        setWaterLogs(updatedLogs);
        localStorage.setItem('homeGardenWaterLogs', JSON.stringify(updatedLogs));
        await saveAllDataToBackend({ waterLogs: updatedLogs });
        toast.success('Water log updated');
      } else {
        // Add new water log
        const newLog = {
          id: Date.now(),
          ...waterForm,
          timestamp: new Date(),
          status: getWaterStatus(waterForm.pH, waterForm.EC, waterForm.temperature)
        };
        const newLogs = [newLog, ...waterLogs];
        setWaterLogs(newLogs);
        localStorage.setItem('homeGardenWaterLogs', JSON.stringify(newLogs));
        await saveAllDataToBackend({ waterLogs: newLogs });
        toast.success('Water log recorded');
      }
      setWaterForm({ zoneId: '', pH: '', EC: '', temperature: '', notes: '' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to save water log');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNutrient = async () => {
    if (!nutrientForm.name) {
      toast.error('Recipe name is required');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing recipe
        const updatedRecipes = nutrientRecipes.map(r => r.id === editingItemId ? { ...r, ...nutrientForm } : r);
        setNutrientRecipes(updatedRecipes);
        localStorage.setItem('homeGardenNutrients', JSON.stringify(updatedRecipes));
        await saveAllDataToBackend({ nutrientRecipes: updatedRecipes });
        toast.success('Recipe updated');
      } else {
        // Add new recipe
        const newRecipe = {
          id: Date.now(),
          ...nutrientForm,
          createdAt: new Date()
        };
        const newRecipes = [newRecipe, ...nutrientRecipes];
        setNutrientRecipes(newRecipes);
        localStorage.setItem('homeGardenNutrients', JSON.stringify(newRecipes));
        await saveAllDataToBackend({ nutrientRecipes: newRecipes });
        toast.success('Nutrient recipe saved');
      }
      setNutrientForm({ name: '', ingredientA: '', ingredientB: '', ratioA: '', ratioB: '', targetCrop: '', dosage: '' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLight = async () => {
    if (!lightForm.zoneId || !lightForm.onTime || !lightForm.offTime) {
      toast.error('Fill in required fields');
      return;
    }
    // Validate that off time is after on time
    if (lightForm.onTime >= lightForm.offTime) {
      toast.error('Off time must be after on time');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing schedule
        const updatedSchedules = lightSchedules.map(s => s.id === editingItemId ? { ...s, ...lightForm } : s);
        setLightSchedules(updatedSchedules);
        localStorage.setItem('homeGardenSchedules', JSON.stringify(updatedSchedules));
        await saveAllDataToBackend({ lightSchedules: updatedSchedules });
        toast.success('Schedule updated');
      } else {
        // Add new schedule
        const newSchedule = {
          id: Date.now(),
          ...lightForm,
          status: 'active',
          createdAt: new Date()
        };
        const newSchedules = [newSchedule, ...lightSchedules];
        setLightSchedules(newSchedules);
        localStorage.setItem('homeGardenSchedules', JSON.stringify(newSchedules));
        await saveAllDataToBackend({ lightSchedules: newSchedules });
        toast.success('Light schedule created');
      }
      setLightForm({ zoneId: '', onTime: '', offTime: '', photoperiod: '', notes: '' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPest = async () => {
    if (!pestForm.pestName || !pestForm.zone) {
      toast.error('Pest name and zone are required');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing pest
        const updatedPests = pestMarks.map(p => p.id === editingItemId ? { ...p, ...pestForm } : p);
        setPestMarks(updatedPests);
        localStorage.setItem('homeGardenPests', JSON.stringify(updatedPests));
        await saveAllDataToBackend({ pestMarks: updatedPests });
        toast.success('Pest record updated');
      } else {
        // Add new pest
        const newPest = {
          id: Date.now(),
          ...pestForm,
          dateMarked: new Date()
        };
        const newPests = [newPest, ...pestMarks];
        setPestMarks(newPests);
        localStorage.setItem('homeGardenPests', JSON.stringify(newPests));
        await saveAllDataToBackend({ pestMarks: newPests });
        toast.success('Pest marked and tracked');
      }
      setPestForm({ pestName: '', zone: '', severity: 'medium', treatment: '' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to mark pest');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = async () => {
    if (!alertForm.zone || !alertForm.message) {
      toast.error('Zone and alert message are required');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing alert
        const updatedAlerts = customAlerts.map(a => a.id === editingItemId ? { ...a, ...alertForm } : a);
        setCustomAlerts(updatedAlerts);
        localStorage.setItem('homeGardenAlerts', JSON.stringify(updatedAlerts));
        await saveAllDataToBackend({ customAlerts: updatedAlerts });
        toast.success('Alert updated');
      } else {
        // Add new alert
        const newAlert = {
          id: Date.now(),
          ...alertForm,
          createdAt: new Date(),
          nextDue: new Date()
        };
        const newAlerts = [newAlert, ...customAlerts];
        setCustomAlerts(newAlerts);
        localStorage.setItem('homeGardenAlerts', JSON.stringify(newAlerts));
        await saveAllDataToBackend({ customAlerts: newAlerts });
        toast.success('Custom alert created');
      }
      setAlertForm({ zone: '', type: 'watering', message: '', frequency: '' });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const updatedAlerts = customAlerts.filter(a => a.id !== id);
      setCustomAlerts(updatedAlerts);
      localStorage.setItem('homeGardenAlerts', JSON.stringify(updatedAlerts));
      await saveAllDataToBackend({ customAlerts: updatedAlerts });
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const markAlertDone = async (alertId) => {
    const alert = customAlerts.find(a => a.id === alertId);
    if (!alert) return;

    let nextDueDate = new Date();

    // Calculate next due date based on frequency
    switch(alert.frequency) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'on-demand':
        // On-demand alerts don't auto-reschedule
        return;
      default:
        return;
    }

    try {
      const updatedAlerts = customAlerts.map(a =>
        a.id === alertId ? { ...a, nextDue: nextDueDate } : a
      );
      setCustomAlerts(updatedAlerts);
      await saveAllDataToBackend({ customAlerts: updatedAlerts });
      toast.success(`Alert marked done. Next due: ${nextDueDate.toLocaleDateString()}`);
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const handleWaterNow = async (zoneId) => {
    // Check for overwatering protection - max 2 waterings per day
    const today = new Date().toDateString();
    const todaysWaterings = waterLogs.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      return String(log.zoneId) === String(zoneId) && logDate === today;
    }).length;

    if (todaysWaterings >= 2) {
      toast.warning(`Zone already watered ${todaysWaterings}x today. Risk of overwatering!`);
      return;
    }

    try {
      const defaultPH = 6.0;
      const defaultEC = 1.2;
      const defaultTemp = 20;
      const wateringRecord = {
        id: Date.now(),
        zoneId: zoneId,
        pH: defaultPH,
        EC: defaultEC,
        temperature: defaultTemp,
        timestamp: new Date(),
        status: getWaterStatus(defaultPH, defaultEC, defaultTemp),
        notes: 'Quick watering logged'
      };
      const newLogs = [wateringRecord, ...waterLogs];
      setWaterLogs(newLogs);
      localStorage.setItem('homeGardenWaterLogs', JSON.stringify(newLogs));
      await saveAllDataToBackend({ waterLogs: newLogs });
      const zoneObj = zones.find(z => String(z.id) === String(zoneId));
      toast.success(`Zone watered: ${zoneObj ? zoneObj.name : zoneId}`);
    } catch (error) {
      toast.error('Failed to log watering');
    }
  };

  const handleAddHarvest = async () => {
    if (!harvestForm.cropName || !harvestForm.zone || !harvestForm.harvestDate) {
      toast.error('Crop name, zone, and harvest date are required');
      return;
    }

    try {
      setLoading(true);
      if (editingItemId) {
        // Edit existing harvest
        const updatedHarvests = harvestLogs.map(h => h.id === editingItemId ? { ...h, ...harvestForm } : h);
        setHarvestLogs(updatedHarvests);
        localStorage.setItem('homeGardenHarvests', JSON.stringify(updatedHarvests));
        await saveAllDataToBackend({ harvestLogs: updatedHarvests });
        toast.success('Harvest updated');
      } else {
        // Add new harvest
        const newHarvest = {
          id: Date.now(),
          ...harvestForm,
          createdAt: new Date()
        };
        const newHarvests = [newHarvest, ...harvestLogs];
        setHarvestLogs(newHarvests);
        localStorage.setItem('homeGardenHarvests', JSON.stringify(newHarvests));
        await saveAllDataToBackend({ harvestLogs: newHarvests });
        toast.success('Harvest logged successfully!');
      }
      setHarvestForm({ cropName: '', zone: '', plantedDate: '', harvestDate: '', quantity: '', unit: 'kg', notes: '', photo: null });
      setShowModal(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error('Failed to log harvest');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHarvest = async (id) => {
    try {
      const updatedHarvests = harvestLogs.filter(h => h.id !== id);
      setHarvestLogs(updatedHarvests);
      localStorage.setItem('homeGardenHarvests', JSON.stringify(updatedHarvests));
      await saveAllDataToBackend({ harvestLogs: updatedHarvests });
      toast.success('Harvest record deleted');
    } catch (error) {
      toast.error('Failed to delete harvest record');
    }
  };

  const getWaterStatus = (pH, EC, temperature) => {
    // coerce to numbers
    const pHn = Number(pH);
    const ECn = Number(EC);
    const Tn = Number(temperature);
    // pH check: optimal 5.5-6.5
    if (isNaN(pHn) || pHn < 5.5 || pHn > 6.5) return 'warning';
    // EC check: optimal 0.5-1.5 mS/cm (zero or very high is bad)
    if (isNaN(ECn) || ECn <= 0.2 || ECn > 1.5) return 'warning';
    // Temperature check: optimal 18-28°C
    if (isNaN(Tn) || Tn < 15 || Tn > 35) return 'warning';
    return 'optimal';
  };

  const formatDateString = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString();
  };

  const getLightScheduleStatus = (onTime, offTime) => {
    // Convert HH:MM to minutes for comparison
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const onMinutes = timeToMinutes(onTime);
    const offMinutes = timeToMinutes(offTime);
    
    // Check if current time is between on and off times
    if (currentMinutes >= onMinutes && currentMinutes < offMinutes) {
      return 'active';
    }
    return 'inactive';
  };

  const isAlertDue = (alert) => {
    if (!alert.frequency) return true; // on-demand alerts are always "due"
    
    const now = new Date();
    const nextDue = new Date(alert.nextDue);
    
    switch(alert.frequency) {
      case 'daily':
        return now.getTime() >= nextDue.getTime();
      case 'weekly':
        return now.getTime() >= nextDue.getTime();
      case 'on-demand':
        return true;
      default:
        return false;
    }
  };

  const getHealthColor = (health) => {
    switch(health) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const calculateZoneHealth = (zoneId) => {
    // Get water logs for this zone from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLogs = waterLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return String(log.zoneId) === String(zoneId) && logDate > sevenDaysAgo;
    });

    if (recentLogs.length === 0) {
      return 'warning'; // No watering data = needs attention
    }

    // Count warning status logs
    const warningCount = recentLogs.filter(log => log.status === 'warning').length;
    const warningPercentage = (warningCount / recentLogs.length) * 100;

    // Check for overwatering (more than 2x per day on average)
    const waterings = recentLogs.length;
    const days = (new Date() - sevenDaysAgo) / (1000 * 60 * 60 * 24);
    const wateringsPerDay = waterings / days;

    if (wateringsPerDay > 2) {
      return 'critical'; // Overwatering
    }
    if (warningPercentage > 50) {
      return 'critical'; // Most recent waters were problematic
    }
    if (warningPercentage > 25) {
      return 'warning'; // Some issues
    }
    if (warningCount > 0) {
      return 'good';
    }
    return 'excellent'; // All optimal
  };

  return (
    <div className="home-garden-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="hg-header">
        <div className="hg-header-content">
          <h1><Sprout size={28} /> My Home Garden</h1>
          <p>Your personal urban farming assistant for hydroponics, rooftop & indoor growing</p>
        </div>
        <div className="hg-header-actions">
          <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem(null); setEditingItemId(null); }}>
            <Plus size={18} /> Add Zone
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="hg-stats-grid">
        <div className="hg-stat-card">
          <div className="hg-stat-icon" style={{ backgroundColor: '#f0fdf4' }}>
            <Home size={24} color="#10b981" />
          </div>
          <div className="hg-stat-info">
            <p className="hg-stat-label">Total Zones</p>
            <h3 className="hg-stat-value">{zones.length}</h3>
          </div>
        </div>

        <div className="hg-stat-card">
          <div className="hg-stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <AlertTriangle size={24} color="#f59e0b" />
          </div>
          <div className="hg-stat-info">
            <p className="hg-stat-label">Active Alerts</p>
            <h3 className="hg-stat-value">{customAlerts.length}</h3>
          </div>
        </div>

        <div className="hg-stat-card">
          <div className="hg-stat-icon" style={{ backgroundColor: '#f0f9ff' }}>
            <Droplet size={24} color="#3b82f6" />
          </div>
          <div className="hg-stat-info">
            <p className="hg-stat-label">Water Logs</p>
            <h3 className="hg-stat-value">{waterLogs.length}</h3>
          </div>
        </div>

        <div className="hg-stat-card">
          <div className="hg-stat-icon" style={{ backgroundColor: '#fce7f3' }}>
            <Lightbulb size={24} color="#ec4899" />
          </div>
          <div className="hg-stat-info">
            <p className="hg-stat-label">Schedules</p>
            <h3 className="hg-stat-value">{lightSchedules.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hg-tabs">
        <button className={`hg-tab ${activeTab === 'zones' ? 'active' : ''}`} onClick={() => setActiveTab('zones')}>
          <Home size={18} /> Zones
        </button>
        <button className={`hg-tab ${activeTab === 'water' ? 'active' : ''}`} onClick={() => setActiveTab('water')}>
          <Droplet size={18} /> Water Chemistry
        </button>
        <button className={`hg-tab ${activeTab === 'nutrients' ? 'active' : ''}`} onClick={() => setActiveTab('nutrients')}>
          <Beaker size={18} /> Nutrient Recipes
        </button>
        <button className={`hg-tab ${activeTab === 'lights' ? 'active' : ''}`} onClick={() => setActiveTab('lights')}>
          <Lightbulb size={18} /> Light Schedule
        </button>
        <button className={`hg-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          <AlertTriangle size={18} /> Smart Alerts
        </button>
        <button className={`hg-tab ${activeTab === 'harvest' ? 'active' : ''}`} onClick={() => setActiveTab('harvest')}>
          <Award size={18} /> Harvest Log
        </button>
        <button className={`hg-tab ${activeTab === 'pests' ? 'active' : ''}`} onClick={() => setActiveTab('pests')}>
          <Target size={18} /> Pest ID
        </button>
      </div>

      {/* ZONES VIEW */}
      {activeTab === 'zones' && (
        <div className="hg-content">
          {zones.length === 0 ? (
            <div className="hg-empty-state">
              <Home size={48} />
              <h3>No zones yet</h3>
              <p>Create your first growing zone to get started</p>
              <button className="hg-btn hg-btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} /> Create First Zone
              </button>
            </div>
          ) : (
            <div className="hg-zones-grid">
              {zones.map(zone => {
                const calculatedHealth = calculateZoneHealth(zone.id);
                return (
                <div key={zone.id} className="hg-zone-card">
                  <div className="hg-zone-header">
                    <div className="hg-zone-title">
                      <h3>{zone.name}</h3>
                      <span className="hg-zone-type">{zone.type}</span>
                    </div>
                    <div className="hg-health-ring" style={{ borderColor: getHealthColor(calculatedHealth) }}>
                      <span>{calculatedHealth}</span>
                    </div>
                  </div>
                  
                  <div className="hg-zone-details">
                    <div className="hg-detail-row">
                      <MapPin size={16} /> <span>{zone.location}</span>
                    </div>
                    <div className="hg-detail-row">
                      <Leaf size={16} /> <span>Level {zone.level}</span>
                    </div>
                    {zone.size && <div className="hg-detail-row">Size: {zone.size}</div>}
                  </div>

                  <div className="hg-zone-actions">
                    <button className="hg-icon-btn" onClick={() => { setZoneForm(zone); setEditingItemId(zone.id); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteZone(zone.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WATER CHEMISTRY VIEW */}
      {activeTab === 'water' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2>Water Quality Logger</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('water'); }}>
              <Plus size={18} /> Log Water
            </button>
          </div>

          {waterLogs.length === 0 ? (
            <div className="hg-empty-state">
              <Droplet size={48} />
              <h3>No water logs yet</h3>
              <p>Start tracking your water chemistry for optimal plant health</p>
            </div>
          ) : (
            <div className="hg-water-logs">
              {waterLogs.map(log => (
                <div key={log.id} className="hg-water-log-card">
                  <div className="hg-log-header">
                    <div className="hg-log-header-left">
                      <span className="hg-timestamp">{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className={`hg-status-badge ${log.status}`}>{log.status}</span>
                    </div>
                  </div>
                  
                  <div className="hg-log-grid">
                    <div className="hg-log-item">
                      <span className="hg-log-label">pH Level</span>
                      <span className="hg-log-value">{log.pH}</span>
                      <small>(Optimal: 5.5-6.5)</small>
                    </div>
                    <div className="hg-log-item">
                      <span className="hg-log-label">EC (mS/cm)</span>
                      <span className="hg-log-value">{log.EC}</span>
                      <small>(Conductivity)</small>
                    </div>
                    <div className="hg-log-item">
                      <span className="hg-log-label">Temperature</span>
                      <span className="hg-log-value">{log.temperature || '-'}°C</span>
                    </div>
                  </div>

                  {log.notes && <p className="hg-log-notes">{log.notes}</p>}

                  <div className="hg-log-actions">
                    <button className="hg-icon-btn" onClick={() => { setWaterForm(log); setEditingItemId(log.id); setEditingItem('water'); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteWaterLog(log.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NUTRIENT RECIPES VIEW */}
      {activeTab === 'nutrients' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2>Nutrient Recipe Book</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('nutrient'); }}>
              <Plus size={18} /> New Recipe
            </button>
          </div>

          {nutrientRecipes.length === 0 ? (
            <div className="hg-empty-state">
              <Beaker size={48} />
              <h3>No recipes saved</h3>
              <p>Create custom nutrient mixes for your crops</p>
            </div>
          ) : (
            <div className="hg-recipe-grid">
              {nutrientRecipes.map(recipe => (
                <div key={recipe.id} className="hg-recipe-card">
                  <div className="hg-recipe-header">
                    <div className="hg-recipe-title">
                      <h3>{recipe.name}</h3>
                      <span className="hg-crop-tag">{recipe.targetCrop}</span>
                    </div>
                  </div>

                  <div className="hg-recipe-details">
                    <div className="hg-ingredient">
                      <strong>Ingredient A:</strong> {recipe.ingredientA} ({recipe.ratioA})
                    </div>
                    <div className="hg-ingredient">
                      <strong>Ingredient B:</strong> {recipe.ingredientB} ({recipe.ratioB})
                    </div>
                    <div className="hg-dosage">
                      <strong>Dosage:</strong> {recipe.dosage}
                    </div>
                  </div>

                  <div className="hg-recipe-actions">
                    <button className="hg-icon-btn" onClick={() => { setNutrientForm(recipe); setEditingItemId(recipe.id); setEditingItem('nutrient'); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteNutrient(recipe.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIGHT SCHEDULE VIEW */}
      {activeTab === 'lights' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2>Light Schedule Manager</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('light'); }}>
              <Plus size={18} /> Add Schedule
            </button>
          </div>

          {lightSchedules.length === 0 ? (
            <div className="hg-empty-state">
              <Lightbulb size={48} />
              <h3>No schedules set</h3>
              <p>Create lighting schedules for your indoor zones</p>
            </div>
          ) : (
            <div className="hg-schedule-list">
              {lightSchedules.map(schedule => (
                <div key={schedule.id} className="hg-schedule-card">
                  <div className="hg-schedule-header">
                    <div>
                      <h3>Zone: {zones.find(z => z.id === schedule.zoneId)?.name || schedule.zoneId}</h3>
                      <p className="hg-schedule-time">{schedule.onTime} - {schedule.offTime}</p>
                    </div>
                    <div className="hg-schedule-meta">
                      <span className={getLightScheduleStatus(schedule.onTime, schedule.offTime) === 'active' ? 'hg-status-active' : 'hg-status-inactive'}>
                        {getLightScheduleStatus(schedule.onTime, schedule.offTime) === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="hg-schedule-details">
                    <div className="hg-photoperiod">
                      <Lightbulb size={18} /> <strong>Photoperiod:</strong> {schedule.photoperiod} hours
                    </div>
                    {schedule.notes && <p className="hg-schedule-notes">{schedule.notes}</p>}
                  </div>

                  <div className="hg-schedule-actions">
                    <button className="hg-icon-btn" onClick={() => { setLightForm(schedule); setEditingItemId(schedule.id); setEditingItem('light'); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteLight(schedule.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMART ALERTS VIEW */}
      {activeTab === 'alerts' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2><AlertTriangle size={20} /> Zone Watering & Alerts</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('alert'); }}>
              <Plus size={18} /> Add Alert
            </button>
          </div>

          {/* ZONE WATERING STATUS */}
          <div className="hg-alerts-section">
            <h3><Droplet size={18} /> Zone Watering Schedule</h3>
            {zones.length === 0 ? (
              <p className="hg-empty-text">Create zones first to set watering schedules</p>
            ) : (
              <div className="hg-watering-grid">
                {zones.map(zone => {
                  const calculatedHealth = calculateZoneHealth(zone.id);
                  return (
                  <div key={zone.id} className="hg-watering-card">
                    <div className="hg-watering-header">
                      <h4>{zone.name}</h4>
                      <span className="hg-watering-type">{zone.type}</span>
                    </div>
                    <div className="hg-watering-details">
                      <p><strong>Location:</strong> {zone.location}</p>
                      <p><strong>Health:</strong> <span style={{ color: getHealthColor(calculatedHealth) }}>{calculatedHealth}</span></p>
                      <p><strong>Last Updated:</strong> {new Date(zone.lastUpdated).toLocaleDateString()}</p>
                    </div>
                    <button className="hg-btn hg-btn-sm hg-btn-primary" onClick={() => handleWaterNow(zone.id)}>
                      <Droplet size={14} /> Water Now
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CUSTOM ALERTS */}
          <div className="hg-alerts-section">
            <h3><AlertTriangle size={18} /> Custom Alerts</h3>
            {customAlerts.length === 0 ? (
              <p className="hg-empty-text">No custom alerts set. Create one to track specific zone needs.</p>
            ) : (
              <div className="hg-alerts-list">
                {customAlerts.map(alert => {
                  const isDue = isAlertDue(alert);
                  return (
                  <div key={alert.id} className={`hg-alert-item ${isDue ? 'hg-alert-due' : ''}`}>
                    <div className="hg-alert-icon" style={{ backgroundColor: alert.type === 'watering' ? '#dcfce7' : '#fef3c7' }}>
                      {alert.type === 'watering' ? <Droplet size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="hg-alert-info">
                      <h4>{alert.zone}</h4>
                      <p>{alert.message}</p>
                      <small>Frequency: {alert.frequency || 'on-demand'} {isDue ? 'DUE' : 'Not yet'}</small>
                    </div>
                    <div className="hg-alert-buttons">
                      {isDue && (
                        <button className="hg-btn hg-btn-sm hg-btn-success" onClick={() => markAlertDone(alert.id)}>
                          ✓ Done
                        </button>
                      )}
                      <button className="hg-icon-btn" onClick={() => { setAlertForm(alert); setEditingItemId(alert.id); setEditingItem('alert'); setShowModal(true); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteAlert(alert.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HARVEST LOG VIEW */}
      {activeTab === 'harvest' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2><Award size={20} /> Harvest "Brag" Log</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('harvest'); }}>
              <Plus size={18} /> Log First Harvest
            </button>
          </div>
          
          {harvestLogs.length === 0 ? (
            <div className="hg-empty-state">
              <Camera size={48} />
              <h3>No harvests logged yet</h3>
              <p>Start documenting your growing journey from seed to plate!</p>
              <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('harvest'); }}>
                <Plus size={18} /> Log First Harvest
              </button>
            </div>
          ) : (
            <div className="hg-harvest-grid">
              {harvestLogs.map(harvest => (
                <div key={harvest.id} className="hg-harvest-card">
                  <div className="hg-harvest-header">
                    <h3>{harvest.cropName}</h3>
                    <span className="hg-harvest-zone">{harvest.zone}</span>
                  </div>

                  {harvest.photo && (
                    <div className="hg-harvest-photo">
                      <img
                        src={harvest.photo}
                        alt={harvest.cropName}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="hg-harvest-timeline">
                    <div className="hg-harvest-info">
                      <span className="hg-harvest-label">Planted:</span>
                      <span>{formatDateString(harvest.plantedDate) || '-'}</span>
                    </div>
                    <div className="hg-harvest-arrow">→</div>
                    <div className="hg-harvest-info">
                      <span className="hg-harvest-label">Harvested:</span>
                      <span>{formatDateString(harvest.harvestDate) || '-'}</span>
                    </div>
                  </div>

                  <div className="hg-harvest-yield">
                    <strong>Yield:</strong> {harvest.quantity} {harvest.unit}
                  </div>

                  {harvest.notes && (
                    <div className="hg-harvest-notes">
                      <p>{harvest.notes}</p>
                    </div>
                  )}

                  <div className="hg-harvest-actions">
                    <button className="hg-icon-btn" onClick={() => { setHarvestForm(harvest); setEditingItemId(harvest.id); setEditingItem('harvest'); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeleteHarvest(harvest.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PEST MARKS VIEW */}
      {activeTab === 'pests' && (
        <div className="hg-content">
          <div className="hg-section-header">
            <h2>🐛 Pest Tracker</h2>
            <button className="hg-btn hg-btn-primary" onClick={() => { setShowModal(true); setEditingItem('pest'); }}>
              <Plus size={18} /> Mark Pest
            </button>
          </div>

          {pestMarks.length === 0 ? (
            <div className="hg-empty-state">
              <Target size={48} />
              <h3>No pests marked yet</h3>
              <p>Track pests you spot in your garden to monitor infestations</p>
            </div>
          ) : (
            <div className="hg-pest-marks-list">
              {pestMarks.map(pest => (
                <div key={pest.id} className="hg-pest-mark-card">
                  <div className="hg-pest-header">
                    <div className="hg-pest-info">
                      <h3>{pest.pestName}</h3>
                      <span className="hg-pest-zone">Zone: {pest.zone}</span>
                    </div>
                    <div className={`hg-severity-badge severity-${pest.severity}`}>
                      {pest.severity}
                    </div>
                  </div>
                  
                  {pest.treatment && (
                    <div className="hg-pest-treatment">
                      <strong>Treatment:</strong> {pest.treatment}
                    </div>
                  )}
                  
                  <div className="hg-pest-date">
                    {new Date(pest.dateMarked).toLocaleDateString()}
                  </div>

                  <div className="hg-pest-actions">
                    <button className="hg-icon-btn" onClick={() => { setPestForm(pest); setEditingItemId(pest.id); setEditingItem('pest'); setShowModal(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="hg-icon-btn hg-icon-btn-danger" onClick={() => handleDeletePest(pest.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="hg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="hg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hg-modal-header">
              <h2>
                {editingItem === 'water' ? <><BarChart size={20} /> Log Water Quality</> :
                 editingItem === 'nutrient' ? <><Beaker size={20} /> New Nutrient Recipe</> :
                 editingItem === 'light' ? <><Lightbulb size={20} /> Add Light Schedule</> :
                 editingItem === 'pest' ? <><Bug size={20} /> Mark Pest</> :
                 editingItem === 'alert' ? <><AlertTriangle size={20} /> Add Custom Alert</> :
                 editingItem === 'harvest' ? <><Camera size={20} /> Log Harvest</> :
                 editingItemId ? <><Edit size={20} /> Edit Zone</> :
                 <><Sprout size={20} /> Add Growing Zone</>}
              </h2>
              <button className="hg-modal-close" onClick={() => { setShowModal(false); setEditingItemId(null); }}>✕</button>
            </div>

            <div className="hg-modal-body">
              {!editingItem && (
                <>
                  <div className="hg-form-group">
                    <label>Zone Name *</label>
                    <input type="text" placeholder="e.g., Kitchen Shelf, Rooftop Box 1" 
                      value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} />
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Growing Method</label>
                      <select value={zoneForm.type} onChange={(e) => setZoneForm({...zoneForm, type: e.target.value})}>
                        <option>Soil-based</option>
                        <option>Hydroponic (NFT)</option>
                        <option>Hydroponic (DWC)</option>
                        <option>Aeroponic</option>
                      </select>
                    </div>

                    <div className="hg-form-group">
                      <label>Location</label>
                      <select value={zoneForm.location} onChange={(e) => setZoneForm({...zoneForm, location: e.target.value})}>
                        <option>Rooftop</option>
                        <option>Indoor</option>
                        <option>Balcony</option>
                        <option>Kitchen</option>
                        <option>Greenhouse</option>
                      </select>
                    </div>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Level (for stacking)</label>
                      <select value={zoneForm.level} onChange={(e) => setZoneForm({...zoneForm, level: e.target.value})}>
                        {[1, 2, 3, 4, 5].map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="hg-form-group">
                      <label>Size/Capacity</label>
                      <input type="text" placeholder="e.g., 2x2 ft, 20L tank" 
                        value={zoneForm.size} onChange={(e) => setZoneForm({...zoneForm, size: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              {editingItem === 'water' && (
                <>
                  <div className="hg-form-group">
                    <label>Zone *</label>
                    <select value={waterForm.zoneId} onChange={(e) => setWaterForm({...waterForm, zoneId: e.target.value})}>
                      <option value="">Select a zone</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>pH Level * (5.5-6.5)</label>
                      <input type="number" step="0.1" placeholder="6.0" 
                        value={waterForm.pH} onChange={(e) => setWaterForm({...waterForm, pH: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>EC (mS/cm)</label>
                      <input type="number" step="0.1" placeholder="1.2" 
                        value={waterForm.EC} onChange={(e) => setWaterForm({...waterForm, EC: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Temperature (°C)</label>
                      <input type="number" step="0.1" placeholder="20" 
                        value={waterForm.temperature} onChange={(e) => setWaterForm({...waterForm, temperature: e.target.value})} />
                    </div>
                  </div>

                  <div className="hg-form-group">
                    <label>Notes</label>
                    <textarea placeholder="Any observations..." 
                      value={waterForm.notes} onChange={(e) => setWaterForm({...waterForm, notes: e.target.value})} />
                  </div>
                </>
              )}

              {editingItem === 'nutrient' && (
                <>
                  <div className="hg-form-group">
                    <label>Recipe Name *</label>
                    <input type="text" placeholder="e.g., Tomato Bloom Mix" 
                      value={nutrientForm.name} onChange={(e) => setNutrientForm({...nutrientForm, name: e.target.value})} />
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Ingredient A</label>
                      <input type="text" placeholder="e.g., Nutrient A" 
                        value={nutrientForm.ingredientA} onChange={(e) => setNutrientForm({...nutrientForm, ingredientA: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Ratio A</label>
                      <input type="text" placeholder="e.g., 5ml per gallon" 
                        value={nutrientForm.ratioA} onChange={(e) => setNutrientForm({...nutrientForm, ratioA: e.target.value})} />
                    </div>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Ingredient B</label>
                      <input type="text" placeholder="e.g., Nutrient B" 
                        value={nutrientForm.ingredientB} onChange={(e) => setNutrientForm({...nutrientForm, ingredientB: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Ratio B</label>
                      <input type="text" placeholder="e.g., 5ml per gallon" 
                        value={nutrientForm.ratioB} onChange={(e) => setNutrientForm({...nutrientForm, ratioB: e.target.value})} />
                    </div>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Target Crop</label>
                      <input type="text" placeholder="e.g., Tomatoes, Lettuce" 
                        value={nutrientForm.targetCrop} onChange={(e) => setNutrientForm({...nutrientForm, targetCrop: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Dosage Instructions</label>
                      <input type="text" placeholder="e.g., Mix 10ml per 10L water" 
                        value={nutrientForm.dosage} onChange={(e) => setNutrientForm({...nutrientForm, dosage: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              {editingItem === 'light' && (
                <>
                  <div className="hg-form-group">
                    <label>Zone *</label>
                    <select value={lightForm.zoneId} onChange={(e) => setLightForm({...lightForm, zoneId: e.target.value})}>
                      <option value="">Select a zone</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Lights ON *</label>
                      <input type="time" value={lightForm.onTime} onChange={(e) => setLightForm({...lightForm, onTime: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Lights OFF *</label>
                      <input type="time" value={lightForm.offTime} onChange={(e) => setLightForm({...lightForm, offTime: e.target.value})} />
                    </div>
                  </div>

                  <div className="hg-form-group">
                    <label>Photoperiod (hours)</label>
                    <input type="number" placeholder="16" value={lightForm.photoperiod} onChange={(e) => setLightForm({...lightForm, photoperiod: e.target.value})} />
                  </div>

                  <div className="hg-form-group">
                    <label>Notes</label>
                    <textarea placeholder="Any special notes..." 
                      value={lightForm.notes} onChange={(e) => setLightForm({...lightForm, notes: e.target.value})} />
                  </div>
                </>
              )}

              {editingItem === 'pest' && (
                <>
                  <div className="hg-form-group">
                    <label>Pest Name *</label>
                    <input type="text" placeholder="e.g., Aphids, Spider Mites, Fungus Gnats" 
                      value={pestForm.pestName} onChange={(e) => setPestForm({...pestForm, pestName: e.target.value})} />
                  </div>

                  <div className="hg-form-group">
                    <label>Zone *</label>
                    <select value={pestForm.zone} onChange={(e) => setPestForm({...pestForm, zone: e.target.value})}>
                      <option value="">Select a zone</option>
                      {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="hg-form-group">
                    <label>Severity Level</label>
                    <select value={pestForm.severity} onChange={(e) => setPestForm({...pestForm, severity: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="hg-form-group">
                    <label>Treatment Applied</label>
                    <textarea placeholder="e.g., Applied neem oil spray, organic pesticide, etc." 
                      value={pestForm.treatment} onChange={(e) => setPestForm({...pestForm, treatment: e.target.value})} />
                  </div>
                </>
              )}

              {editingItem === 'alert' && (
                <>
                  <div className="hg-form-group">
                    <label>Zone *</label>
                    <select value={alertForm.zone} onChange={(e) => setAlertForm({...alertForm, zone: e.target.value})}>
                      <option value="">Select a zone</option>
                      {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="hg-form-group">
                    <label>Alert Type</label>
                    <select value={alertForm.type} onChange={(e) => setAlertForm({...alertForm, type: e.target.value})}>
                      <option value="watering">Watering</option>
                      <option value="health">Plant Health</option>
                      <option value="pest">Pest Control</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="hg-form-group">
                    <label>Alert Message *</label>
                    <textarea placeholder="e.g., Water plants every 3 days, Check for yellowing leaves, etc." 
                      value={alertForm.message} onChange={(e) => setAlertForm({...alertForm, message: e.target.value})} />
                  </div>

                  <div className="hg-form-group">
                    <label>Frequency</label>
                    <select value={alertForm.frequency} onChange={(e) => setAlertForm({...alertForm, frequency: e.target.value})}>
                      <option value="">On Demand</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}

              {editingItem === 'harvest' && (
                <>
                  <div className="hg-form-group">
                    <label>Crop Name *</label>
                    <input type="text" placeholder="e.g., Tomatoes, Lettuce, Basil" 
                      value={harvestForm.cropName} onChange={(e) => setHarvestForm({...harvestForm, cropName: e.target.value})} />
                  </div>

                  <div className="hg-form-group">
                    <label>Zone *</label>
                    <select value={harvestForm.zone} onChange={(e) => setHarvestForm({...harvestForm, zone: e.target.value})}>
                      <option value="">Select a zone</option>
                      {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Planted Date</label>
                      <input type="date" value={harvestForm.plantedDate} onChange={(e) => setHarvestForm({...harvestForm, plantedDate: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Harvest Date *</label>
                      <input type="date" value={harvestForm.harvestDate} onChange={(e) => setHarvestForm({...harvestForm, harvestDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="hg-form-row">
                    <div className="hg-form-group">
                      <label>Quantity *</label>
                      <input type="number" placeholder="e.g., 5" value={harvestForm.quantity} onChange={(e) => setHarvestForm({...harvestForm, quantity: e.target.value})} />
                    </div>
                    <div className="hg-form-group">
                      <label>Unit</label>
                      <select value={harvestForm.unit} onChange={(e) => setHarvestForm({...harvestForm, unit: e.target.value})}>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="lbs">Pounds (lbs)</option>
                        <option value="units">Units</option>
                        <option value="bunches">Bunches</option>
                      </select>
                    </div>
                  </div>

                  <div className="hg-form-group">
                    <label>Photo</label>
                    <input type="text" placeholder="Enter photo URL or base64" 
                      value={harvestForm.photo || ''} onChange={(e) => setHarvestForm({...harvestForm, photo: e.target.value})} />
                    <small>Paste image URL or base64 string</small>
                  </div>

                  <div className="hg-form-group">
                    <label>Notes & Observations</label>
                    <textarea placeholder="e.g., Great yield this season! Plants were healthy throughout..." 
                      value={harvestForm.notes} onChange={(e) => setHarvestForm({...harvestForm, notes: e.target.value})} />
                  </div>
                </>
              )}
            </div>

            <div className="hg-modal-footer">
              <button className="hg-btn hg-btn-secondary" onClick={() => { setShowModal(false); setEditingItemId(null); }}>Cancel</button>
              <button className="hg-btn hg-btn-primary" onClick={() => {
                if (!editingItem) handleAddZone();
                else if (editingItem === 'water') handleAddWaterLog();
                else if (editingItem === 'nutrient') handleAddNutrient();
                else if (editingItem === 'light') handleAddLight();
                else if (editingItem === 'pest') handleAddPest();
                else if (editingItem === 'alert') handleAddAlert();
                else if (editingItem === 'harvest') handleAddHarvest();
              }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeGarden;
