import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { FileText, Navigation, Calendar, UserCheck, ShieldAlert, Image as ImageIcon } from "lucide-react";

export default function InvestigationNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchInvestigationNotes();
  }, []);

  const fetchInvestigationNotes = async () => {
    try {
      const notesRef = collection(db, "investigation_notes");
      // Order by descending created time to show newest first
      const q = query(notesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const loadedNotes = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedNotes.push({
          id: doc.id,
          ...data,
          // Format Firestore timestamp safely
          timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        });
      });
      
      setNotes(loadedNotes);
    } catch (err) {
      console.error("Error fetching investigation notes:", err);
      if (err.code === 'permission-denied') {
        setError("Missing or insufficient permissions. Please update your Firestore Rules to allow public read access for 'investigation_notes': allow read: if true;");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[500px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="p-8"><div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-medium">Error: {error}</div></div>;

  return (
    <div className="p-8 max-w-[90rem] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="text-blue-600" />
            Police Investigation Notes
          </h1>
          <p className="text-gray-500 mt-1">Review physical fine tickets and incident reports submitted by police officers in the field.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Submitted Violation Reports</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Bus Assignment</th>
                <th className="px-6 py-4 font-semibold">Driver Name</th>
                <th className="px-6 py-4 font-semibold">Violation Type</th>
                <th className="px-6 py-4 font-semibold">Reporting Officer</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold text-center">Ticket Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500 bg-white">
                    <ShieldAlert size={48} className="mx-auto text-gray-300 mb-4 opacity-70" />
                    <h3 className="text-lg font-medium text-gray-900">No Investigation Notes Found</h3>
                    <p className="mt-1">Police officers have not submitted any investigation notes yet.</p>
                  </td>
                </tr>
              ) : (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold font-mono border border-blue-100">
                        <Navigation size={12} />
                        {note.busNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {note.driverName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded border border-red-100 text-xs font-bold tracking-wide shadow-sm">
                        <ShieldAlert size={12} />
                        {note.violationType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><UserCheck size={12} /></div>
                        {note.officerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(note.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {note.ticketImageUrl ? (
                        <button
                          onClick={() => setSelectedImage(note.ticketImageUrl)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg text-xs font-semibold border border-gray-200 shadow-sm"
                        >
                          <ImageIcon size={14} className="text-blue-600" />
                          View Ticket
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium border border-gray-100">
                          <ImageIcon size={14} className="opacity-50" />
                          No Photo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-4 -right-4 sm:top-0 sm:right-0 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Full size ticket" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
