import React from 'react';
import { Trash2 } from 'lucide-react';

const SavedReportsList = ({ savedReports, onLoadReport, onDeleteReport }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Saved Reports
      </h2>
      
      {savedReports.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No saved reports yet. Generate a report and save it to access it later.
        </p>
      ) : (
        <ul className="space-y-2">
          {savedReports.map((report) => (
            <li key={report.id} className="flex items-center justify-between">
              <button
                onClick={() => onLoadReport(report)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[160px] text-left"
              >
                {report.name}
              </button>
              <button
                onClick={() => onDeleteReport(report.id)}
                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedReportsList;
