import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
    // Sample data structure expected:
    // [{ name: 'Jan', revenue: 4000, expenses: 2400 }, ...]

    // If no data, show placeholder
    const chartData = data || [
        { name: 'Jan', revenue: 0, expenses: 0 },
        { name: 'Feb', revenue: 0, expenses: 0 },
        { name: 'Mar', revenue: 0, expenses: 0 },
    ];

    return (
        <div className="h-80 w-full bg-white p-4 rounded-xl border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
