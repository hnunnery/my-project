"use client";
import React, { useEffect, useState } from "react";

type DynastyValueRow = {
  playerId: string;
  dynastyValue: number | null;
  trend7d: number | null;
  trend30d: number | null;
  player: { 
    name: string; 
    pos: string; 
    team: string | null 
  };
};

export default function ValuesPage() {
  const [rows, setRows] = useState<DynastyValueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    fetch("/api/dynasty/values")
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch dynasty values");
        return r.json();
      })
      .then(setRows)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Dynasty Values</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Dynasty Values
        </h1>
        <a href="/dashboard/assistant" className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
          🤖 Ask Assistant
        </a>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                Player
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                Pos
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                Team
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                Value
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                Δ 7d
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                Δ 30d
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr 
                key={r.playerId} 
                className={`${
                  index % 2 === 0 
                    ? "bg-white dark:bg-gray-900" 
                    : "bg-gray-50 dark:bg-gray-800"
                } border-t border-gray-200 dark:border-gray-700`}
              >
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  {r.player.name}
                </td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                  {r.player.pos}
                </td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                  {r.player.team ?? "-"}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                  {r.dynastyValue?.toFixed(1) ?? "-"}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${
                  Number(r.trend7d) > 0 
                    ? "text-green-600 dark:text-green-400" 
                    : Number(r.trend7d) < 0 
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {r.trend7d ? (r.trend7d > 0 ? "+" : "") + r.trend7d.toFixed(1) : "-"}
                </td>
                <td className={`px-3 py-2 text-right font-medium ${
                  Number(r.trend30d) > 0 
                    ? "text-green-600 dark:text-green-400" 
                    : Number(r.trend30d) < 0 
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {r.trend30d ? (r.trend30d > 0 ? "+" : "") + r.trend30d.toFixed(1) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No dynasty values available. Run the ETL pipeline to populate data.
        </div>
      )}
    </div>
  );
}
