import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { Store, Package, DollarSign, TrendingUp } from 'lucide-react';

interface PharmacyVisit {
  id: number;
  date: string;
  pharmacy: string;
  medicine?: string;
  quantity?: number;
  amount?: number;
  type: 'collection' | 'order';
  status: 'pending' | 'approved' | 'rejected';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PharmacyDashboard() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setDate(1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');

  const visits = useMemo(() => {
    const savedCollections = JSON.parse(localStorage.getItem('collections') || '[]');
    return savedCollections.filter((visit: PharmacyVisit) => {
      const visitDate = new Date(visit.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return (
        visitDate >= startDate &&
        visitDate <= endDate &&
        (!selectedPharmacy || visit.pharmacy === selectedPharmacy) &&
        (!selectedMedicine || visit.medicine === selectedMedicine)
      );
    });
  }, [dateRange, selectedPharmacy, selectedMedicine]);

  const pharmacies = useMemo(() => {
    return Array.from(new Set(visits.map(v => v.pharmacy)));
  }, [visits]);

  const medicines = useMemo(() => {
    return Array.from(new Set(visits.filter(v => v.medicine).map(v => v.medicine)));
  }, [visits]);

  const stats = useMemo(() => {
    const totalCollections = visits
      .filter(v => v.type === 'collection')
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    const totalOrders = visits
      .filter(v => v.type === 'order')
      .reduce((sum, v) => sum + (v.quantity || 0), 0);

    const medicineDistribution = visits
      .filter(v => v.type === 'order')
      .reduce((acc, v) => {
        if (v.medicine && v.quantity) {
          acc[v.medicine] = (acc[v.medicine] || 0) + v.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

    const pharmacyPerformance = visits.reduce((acc, v) => {
      if (!acc[v.pharmacy]) {
        acc[v.pharmacy] = {
          collections: 0,
          orders: 0,
        };
      }
      if (v.type === 'collection') {
        acc[v.pharmacy].collections += v.amount || 0;
      } else {
        acc[v.pharmacy].orders += v.quantity || 0;
      }
      return acc;
    }, {} as Record<string, { collections: number; orders: number }>);

    return {
      totalCollections,
      totalOrders,
      medicineDistribution,
      pharmacyPerformance,
    };
  }, [visits]);

  const medicineChartData = useMemo(() => {
    return Object.entries(stats.medicineDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [stats.medicineDistribution]);

  const pharmacyPerformanceData = useMemo(() => {
    return Object.entries(stats.pharmacyPerformance).map(([name, data]) => ({
      name,
      collections: data.collections,
      orders: data.orders,
    }));
  }, [stats.pharmacyPerformance]);

  const collectionTrends = useMemo(() => {
    const trends = visits
      .filter(v => v.type === 'collection')
      .reduce((acc, v) => {
        const date = v.date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += v.amount || 0;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(trends)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [visits]);

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">لوحة تحكم الصيدليات</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الصيدلية</label>
              <select
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">الكل</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy} value={pharmacy}>{pharmacy}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الدواء</label>
              <select
                value={selectedMedicine}
                onChange={(e) => setSelectedMedicine(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">الكل</option>
                {medicines.map(medicine => (
                  <option key={medicine} value={medicine}>{medicine}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Store className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">الصيدليات النشطة</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{pharmacies.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">إجمالي التحصيلات</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.totalCollections} ريال</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">إجمالي الطلبيات</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الأدوية</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicineChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {medicineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">أداء الصيدليات</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pharmacyPerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collections" name="التحصيلات" fill="#8884d8" />
                  <Bar dataKey="orders" name="الطلبيات" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">اتجاهات التحصيل</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={collectionTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'yyyy/MM/dd')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="المبلغ"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}