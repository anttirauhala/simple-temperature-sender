import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { fi } from 'date-fns/locale'

interface Measurement {
  timestamp: number
  temperature: number
  humidity: number
}

type TimeRange = 'today' | 'thisMonth' | 'lastMonth'

interface Props {
  measurements: Measurement[]
  currentValue?: number
  timestamp?: number
  timeRange?: TimeRange
}

function HumidityChart({ measurements, currentValue, timestamp, timeRange = 'today' }: Props) {
  // Choose date format based on time range
  const getTimeFormat = () => {
    switch (timeRange) {
      case 'today':
        return 'HH:mm'
      case 'thisMonth':
      case 'lastMonth':
        return 'd.M HH:mm'
    }
  }

  const data = measurements.map(m => ({
    time: format(new Date(m.timestamp), getTimeFormat(), { locale: fi }),
    kosteus: Number(m.humidity.toFixed(1))
  }))

  return (
    <div className="chart-card">
      <h2>💧 Kosteus</h2>
      
      {currentValue !== undefined && (
        <>
          <div className="current-value humidity">
            {currentValue.toFixed(1)} %
          </div>
          {timestamp && (
            <div className="timestamp">
              {format(new Date(timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: fi })}
            </div>
          )}
        </>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: '%', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}
            formatter={(value: number) => [`${value} %`, 'Kosteus']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="kosteus" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HumidityChart
