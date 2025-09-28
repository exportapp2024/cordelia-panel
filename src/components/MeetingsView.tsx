import React from 'react';
import { Calendar, Clock, User, Plus } from 'lucide-react';
import { useMeetings, Meeting } from '../hooks/useMeetings';

export const MeetingsView: React.FC = () => {
  const { meetings, loading } = useMeetings();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const todaysMeetings = meetings.filter(meeting => {
    const today = new Date().toISOString().split('T')[0];
    return meeting.date === today;
  }).length;

  const totalPatients = new Set(meetings.map(m => m.patient_name)).size;
  
  const nextMeeting = meetings
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    })[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
        <p className="text-gray-600">Yaklaşan randevularınızı yönetin</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Randevular yükleniyor...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz randevu yok</h3>
            <p className="text-gray-600">Başlamak için ilk randevunuzu oluşturun.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-6 font-semibold text-gray-900">Tarih</th>
                <th className="text-left p-6 font-semibold text-gray-900">Saat</th>
                <th className="text-left p-6 font-semibold text-gray-900">Hasta</th>
                <th className="text-left p-6 font-semibold text-gray-900">Tür</th>
                <th className="text-left p-6 font-semibold text-gray-900">Durum</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting, index) => (
                <tr
                  key={meeting.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === meetings.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{formatDate(meeting.date)}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{meeting.time}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{meeting.patient_name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-600">{meeting.type}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{todaysMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Meeting</p>
              <p className="text-lg font-bold text-gray-900">
                {nextMeeting ? nextMeeting.time : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};