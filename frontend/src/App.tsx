import { useEffect, useState } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { fi } from 'date-fns/locale'
import TemperatureChart from './components/TemperatureChart'
import HumidityChart from './components/HumidityChart'

interface Measurement {
  timestamp: number
  temperature: number
  humidity: number
  device_id: string
}

type TimeRange = 'today' | 'thisMonth' | 'lastMonth'

function App() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [displayMeasurements, setDisplayMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('today')

  // Aggregate measurements for longer time periods
  const aggregateData = (data: Measurement[], intervalMinutes: number): Measurement[] => {
    if (data.length === 0) return []
    
    const aggregated: Measurement[] = []
    const intervalMs = intervalMinutes * 60 * 1000
    
    // Sort by timestamp
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp)
    
    let currentBucket: Measurement[] = []
    let bucketStart = Math.floor(sorted[0].timestamp / intervalMs) * intervalMs
    
    for (const measurement of sorted) {
      const measurementBucket = Math.floor(measurement.timestamp / intervalMs) * intervalMs
      
      if (measurementBucket === bucketStart) {
        currentBucket.push(measurement)
      } else {
        // Calculate averages for the bucket
        if (currentBucket.length > 0) {
          const avgTemp = currentBucket.reduce((sum, m) => sum + m.temperature, 0) / currentBucket.length
          const avgHumidity = currentBucket.reduce((sum, m) => sum + m.humidity, 0) / currentBucket.length
          
          aggregated.push({
            timestamp: bucketStart + intervalMs / 2, // Middle of the interval
            temperature: Math.round(avgTemp * 100) / 100,
            humidity: Math.round(avgHumidity * 100) / 100,
            device_id: currentBucket[0].device_id
          })
        }
        
        currentBucket = [measurement]
        bucketStart = measurementBucket
      }
    }
    
    // Add the last bucket
    if (currentBucket.length > 0) {
      const avgTemp = currentBucket.reduce((sum, m) => sum + m.temperature, 0) / currentBucket.length
      const avgHumidity = currentBucket.reduce((sum, m) => sum + m.humidity, 0) / currentBucket.length
      
      aggregated.push({
        timestamp: bucketStart + intervalMs / 2,
        temperature: Math.round(avgTemp * 100) / 100,
        humidity: Math.round(avgHumidity * 100) / 100,
        device_id: currentBucket[0].device_id
      })
    }
    
    return aggregated
  }

  const getTimeRangeParams = (range: TimeRange): { start: number; end: number } => {
    const now = new Date()
    
    switch (range) {
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return {
          start: today.getTime(),
          end: tomorrow.getTime()
        }
      
      case 'thisMonth':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return {
          start: startOfMonth(now).getTime(),
          end: nextMonth.getTime()
        }
      
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        return {
          start: startOfMonth(lastMonth).getTime(),
          end: startOfMonth(now).getTime()
        }
    }
  }

  const filterByTimeRange = (measurements: Measurement[], start: number, end: number): Measurement[] => {
    return measurements.filter(m => m.timestamp >= start && m.timestamp < end)
  }

  const fetchData = async (range: TimeRange) => {
    try {
      setError(null)
      setLoading(true)
      
      const { start, end } = getTimeRangeParams(range)
      
      // Determine API URL - use environment variable or fallback
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      
      const response = await fetch(
        `${apiUrl}/measurements?startTime=${start}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      let rawMeasurements = data.measurements || []
      
      // Filter measurements to only include the selected time range
      rawMeasurements = filterByTimeRange(rawMeasurements, start, end)
      
      setMeasurements(rawMeasurements)
      
      // Aggregate data for month views
      let processed = rawMeasurements
      if (range === 'thisMonth' || range === 'lastMonth') {
        // Aggregate to hourly data for month view
        processed = aggregateData(rawMeasurements, 60)
      }
      
      setDisplayMeasurements(processed)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Virhe datan haussa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(timeRange)
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => fetchData(timeRange), 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const latestMeasurement = measurements[measurements.length - 1]

  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case 'today': return 'tänään'
      case 'thisMonth': return 'tässä kuussa'
      case 'lastMonth': return 'viime kuussa'
    }
  }

  const getTimeRangeTitle = (range: TimeRange): string => {
    const now = new Date()
    switch (range) {
      case 'today': 
        return format(now, 'd.M.yyyy', { locale: fi })
      case 'thisMonth': 
        return format(now, 'MMMM yyyy', { locale: fi })
      case 'lastMonth': 
        const lastMonth = subMonths(now, 1)
        return format(lastMonth, 'MMMM yyyy', { locale: fi })
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🌡️ Lämpötilan ja Kosteuden Seuranta</h1>
        <p>ESP32-C3 SHT30 -sensori</p>
        
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => setTimeRange('today')}
          >
            Tänään
          </button>
          <button
            className={`time-range-btn ${timeRange === 'thisMonth' ? 'active' : ''}`}
            onClick={() => setTimeRange('thisMonth')}
          >
            Tämä kuukausi
          </button>
          <button
            className={`time-range-btn ${timeRange === 'lastMonth' ? 'active' : ''}`}
            onClick={() => setTimeRange('lastMonth')}
          >
            Edellinen kuukausi
          </button>
        </div>

        <div className="period-title">
          <h3>{getTimeRangeTitle(timeRange)}</h3>
        </div>
        
        <div className="status">
          {loading && (
            <span className="status-badge loading">Ladataan...</span>
          )}
          {!loading && measurements.length > 0 && (
            <span className="status-badge success">
              {measurements.length} mittausta {getTimeRangeLabel(timeRange)}
              {displayMeasurements.length !== measurements.length && 
                ` (näytetään ${displayMeasurements.length} aggregoitua)`
              }
            </span>
          )}
          {!loading && error && (
            <span className="status-badge error">Yhteysvirhe</span>
          )}
        </div>
        
        {lastUpdate && (
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Päivitetty: {format(lastUpdate, 'HH:mm:ss', { locale: fi })}
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Virhe:</strong> {error}
          <br />
          <small>Varmista että API on käynnissä ja VITE_API_URL on asetettu oikein</small>
        </div>
      )}

      {loading && <div className="loading">Ladataan mittaushistoriaa...</div>}

      {!loading && !error && measurements.length === 0 && (
        <div className="no-data">
          <h2>Ei mittauksia valitulla ajanjaksolla</h2>
          <p>Valitse toinen ajanjakso tai odota että laite lähettää mittauksia</p>
        </div>
      )}

      {!loading && displayMeasurements.length > 0 && (
        <div className="charts-container">
          <TemperatureChart 
            measurements={displayMeasurements} 
            currentValue={latestMeasurement?.temperature}
            timestamp={latestMeasurement?.timestamp}
            timeRange={timeRange}
          />
          <HumidityChart 
            measurements={displayMeasurements} 
            currentValue={latestMeasurement?.humidity}
            timestamp={latestMeasurement?.timestamp}
            timeRange={timeRange}
          />
        </div>
      )}
    </div>
  )
}

export default App
