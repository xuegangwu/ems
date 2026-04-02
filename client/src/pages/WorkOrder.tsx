import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';

const STATIONS = [
  { id: 'station-001', name: '苏州工业园光储充一体化', location: '江苏省苏州市', lat: 31.2989, lng: 120.6853 },
  { id: 'station-002', name: '无锡储能电站', location: '江苏省无锡市', lat: 31.5747, lng: 120.2925 },
  { id: 'station-003', name: '杭州光储一体化电站', location: '浙江省杭州市', lat: 30.2741, lng: 120.1551 },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const a = Math.sin(((lat2 - lat1) * Math.PI / 180) / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(((lng2 - lng1) * Math.PI / 180) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function analyze(text: string, lat: number, lng: number) {
  const nearest = [...STATIONS].sort(
    (a, b) => getDistance(lat, lng, a.lat, a.lng) - getDistance(lat, lng, b.lat, b.lng)
  )[0];
  const t = text.toLowerCase();
  let issueType = 'other';
  let urgency: 'urgent' | 'important' | 'normal' = 'normal';
  if (t.includes('停机') || t.includes('故障') || t.includes('坏了') || t.includes('爆炸') || t.includes('着火')) {
    issueType = 'critical'; urgency = 'urgent';
  } else if (t.includes('异常') || t.includes('报警') || t.includes('告警') || t.includes('不发电') || t.includes('不工作')) {
    issueType = 'anomaly'; urgency = 'important';
  } else if (t.includes('效率低') || t.includes('下降')) {
    issueType = 'performance'; urgency = 'important';
  } else if (t.includes('通讯') || t.includes('断网') || t.includes('掉线')) {
    issueType = 'communication'; urgency = 'important';
  } else if (t.includes('储能') || t.includes('电池')) {
    issueType = 'battery';
  } else if (t.includes('光伏') || t.includes('太阳能') || t.includes('板子')) {
    issueType = 'solar';
  } else if (t.includes('充电') || t.includes('充电桩')) {
    issueType = 'ev_charger';
  } else if (t.includes('维护') || t.includes('检修')) {
    issueType = 'maintenance'; urgency = 'normal';
  }
  return { station: nearest, issueType, urgency, summary: text };
}

const ISSUE_TYPES = [
  { value: 'solar', label: 'Solar anomaly', color: '#FFD700' },
  { value: 'battery', label: 'Battery fault', color: '#00D4AA' },
  { value: 'ev_charger', label: 'EV charger fault', color: '#38A169' },
  { value: 'anomaly', label: 'Device alarm', color: '#FF9500' },
  { value: 'critical', label: 'Critical fault', color: '#FF3B30' },
  { value: 'communication', label: 'Comm disruption', color: '#5856D6' },
  { value: 'performance', label: 'Efficiency drop', color: '#AF52DE' },
  { value: 'maintenance', label: 'Maintenance', color: '#8E8E93' },
  { value: 'other', label: 'Other', color: '#636366' },
];

const URGENCY_COLOR: Record<string, string> = { urgent: '#FF3B30', important: '#FF9500', normal: '#34C759' };
const URGENCY_LABEL: Record<string, string> = { urgent: 'URGENT', important: 'IMPORTANT', normal: 'NORMAL' };

export default function WorkOrder() {
  const [step, setStep] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [nearest, setNearest] = useState(STATIONS[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ station: typeof STATIONS[0]; issueType: string; urgency: 'urgent' | 'important' | 'normal'; summary: string } | null>(null);
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedStation, setSelectedStation] = useState('');
  const [issueType, setIssueType] = useState('');
  const [urgency, setUrgency] = useState<'urgent' | 'important' | 'normal'>('normal');
  const recognitionRef = useRef<any>(null);

  // Init GPS + Speech Recognition
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
          setGpsPos(pos);
          setNearest([...STATIONS].sort((a, b) => getDistance(pos.lat, pos.lng, a.lat, a.lng) - getDistance(pos.lat, pos.lng, b.lat, b.lng))[0]);
          setGpsLoading(false);
        },
        () => setGpsLoading(false)
      );
    } else {
      setGpsLoading(false);
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = 'zh-CN';
      r.onresult = (e: any) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setVoiceText(t); };
      r.onend = () => setIsListening(false);
      recognitionRef.current = r;
    }
  }, []);

  const startVoice = () => {
    if (!recognitionRef.current) { message.info('Voice not supported, please type'); return; }
    setVoiceText(''); setIsListening(true);
    recognitionRef.current.start();
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleAnalyze = async () => {
    if (!voiceText.trim()) { message.warning('Please speak first'); return; }
    if (!gpsPos) { message.warning('GPS not ready, please wait'); return; }
    setAnalyzing(true);
    const r = await analyze(voiceText, gpsPos.lat, gpsPos.lng);
    setResult(r);
    setSelectedStation(r.station.id);
    setIssueType(r.issueType);
    setUrgency(r.urgency);
    setDesc(r.summary);
    setAnalyzing(false);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedStation || !issueType || !desc) { message.warning('Please complete all fields'); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>[OK]</div>
        <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 8, fontWeight: 600 }}>Submitted</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
          WO-{Date.now().toString().slice(-6)}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 32 }}>
          Maintenance team will respond soon
        </p>
        <button
          onClick={() => { setStep(0); setVoiceText(''); setResult(null); setSelectedStation(''); setIssueType(''); setUrgency('normal'); setDesc(''); setSubmitted(false); }}
          style={{ background: '#00D4AA', color: '#000', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: 360 }}
        >
          New order
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: step === 0 ? '#00D4AA' : step === 1 ? '#FF9500' : '#38A169' }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {step === 0 ? 'Step 1/3: Voice + GPS' : step === 1 ? 'Step 2/3: Confirm' : 'Step 3/3: Submit'}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ margin: '16px 20px', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: step === 0 ? '33%' : step === 1 ? '66%' : '100%', background: '#00D4AA', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* ─── STEP 0: Voice + GPS ─── */}
      {step === 0 && (
        <div style={{ padding: '0 20px 100px' }}>

          {/* GPS Card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>📍 GPS Location</div>
            {gpsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#00D4AA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Getting location...
              </div>
            ) : gpsPos ? (
              <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>LAT</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#00D4AA', fontFamily: 'monospace' }}>{gpsPos.lat.toFixed(5)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>LNG</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#00D4AA', fontFamily: 'monospace' }}>{gpsPos.lng.toFixed(5)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Nearest station</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#00D4AA' }}>{nearest.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{nearest.location} · {getDistance(gpsPos.lat, gpsPos.lng, nearest.lat, nearest.lng).toFixed(1)} km</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>GPS not available</div>
            )}
          </div>

          {/* Voice Card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>[Voice] Describe the problem</div>

            {/* Big mic button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <button
                onClick={isListening ? stopVoice : startVoice}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: isListening ? 'rgba(255,59,48,0.15)' : 'rgba(0,212,170,0.12)',
                  border: `2px solid ${isListening ? '#FF3B30' : '#00D4AA'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isListening ? '0 0 0 0 rgba(255,59,48,0.4)' : '0 0 0 0 rgba(0,212,170,0.4)',
                  animation: isListening ? 'pulse-red 1.5s infinite' : 'pulse-green 2s infinite',
                }}
              >
                <span style={{ fontSize: 36 }}>{isListening ? '[X]' : '[MIC]'}</span>
              </button>
            </div>

            {isListening && (
              <div style={{ textAlign: 'center', color: '#FF3B30', fontSize: 12, marginBottom: 12, animation: 'blink 1s infinite' }}>
                ● Recording... speak now
              </div>
            )}

            {/* Transcript box */}
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '14px 16px',
              minHeight: 100, fontSize: 15, lineHeight: 1.6,
              color: voiceText ? '#fff' : 'rgba(255,255,255,0.3)',
              border: voiceText ? '1px solid rgba(0,212,170,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              {voiceText || 'Tap the mic button and describe the problem...'}
            </div>

            {voiceText && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: 6 }}>
                {voiceText.length} chars
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={handleAnalyze}
            disabled={!voiceText.trim() || analyzing || gpsLoading}
            style={{
              width: '100%', height: 54, borderRadius: 14, border: 'none',
              background: voiceText.trim() && !analyzing && !gpsLoading ? '#00D4AA' : 'rgba(255,255,255,0.08)',
              color: voiceText.trim() && !analyzing && !gpsLoading ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 17, fontWeight: 700, cursor: voiceText.trim() && !analyzing && !gpsLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {analyzing ? '[AI analyzing...]' : '[AI analyze] ->'}
          </button>
        </div>
      )}

      {/* ─── STEP 1: AI Confirmation ─── */}
      {step === 1 && result && (
        <div style={{ padding: '0 20px 100px' }}>

          {/* AI result card */}
          <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>[AI] Analysis</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>
              "{result.summary}"
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>Nearest: {result.station.name}</span>
              <span style={{ background: `${ISSUE_TYPES.find(t => t.value === result.issueType)?.color}22`, color: ISSUE_TYPES.find(t => t.value === result.issueType)?.color, borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>
                {ISSUE_TYPES.find(t => t.value === result.issueType)?.label}
              </span>
              <span style={{ background: `${URGENCY_COLOR[result.urgency]}22`, color: URGENCY_COLOR[result.urgency], borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>
                {URGENCY_LABEL[result.urgency]}
              </span>
            </div>
          </div>

          {/* Station selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Station</div>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none', appearance: 'none' }}
            >
              {STATIONS.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>{s.name} ({s.location})</option>)}
            </select>
          </div>

          {/* Issue type */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Issue type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ISSUE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setIssueType(t.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: `1px solid ${issueType === t.value ? t.color : 'rgba(255,255,255,0.08)'}`,
                    background: issueType === t.value ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                    color: issueType === t.value ? t.color : 'rgba(255,255,255,0.5)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Urgency</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['urgent', 'important', 'normal'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    border: `1px solid ${urgency === u ? URGENCY_COLOR[u] : 'rgba(255,255,255,0.08)'}`,
                    background: urgency === u ? `${URGENCY_COLOR[u]}22` : 'rgba(255,255,255,0.03)',
                    color: urgency === u ? URGENCY_COLOR[u] : 'rgba(255,255,255,0.4)',
                    fontSize: 13, fontWeight: urgency === u ? 700 : 400, cursor: 'pointer',
                  }}
                >
                  {URGENCY_LABEL[u]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Description</div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe the problem..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>

          {/* Back */}
          <button
            onClick={() => setStep(0)}
            style={{ width: '100%', height: 50, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer', marginBottom: 10 }}
          >
            &lt;- Back
          </button>

          {/* Next */}
          <button
            onClick={() => setStep(2)}
            disabled={!selectedStation || !issueType || !desc}
            style={{
              width: '100%', height: 54, borderRadius: 14, border: 'none',
              background: selectedStation && issueType && desc ? '#00D4AA' : 'rgba(255,255,255,0.08)',
              color: selectedStation && issueType && desc ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 17, fontWeight: 700, cursor: selectedStation && issueType && desc ? 'pointer' : 'not-allowed',
            }}
          >
            Confirm &rarr;
          </button>
        </div>
      )}

      {/* ─── STEP 2: Submit ─── */}
      {step === 2 && (
        <div style={{ padding: '0 20px 100px' }}>

          {/* Summary card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 14 }}>[Confirm]</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Station</div>
              <div style={{ fontSize: 15, color: '#fff' }}>{STATIONS.find(s => s.id === selectedStation)?.name}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Issue</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: `${ISSUE_TYPES.find(t => t.value === issueType)?.color}22`, color: ISSUE_TYPES.find(t => t.value === issueType)?.color, borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>{ISSUE_TYPES.find(t => t.value === issueType)?.label}</span>
                <span style={{ background: `${URGENCY_COLOR[urgency]}22`, color: URGENCY_COLOR[urgency], borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>{URGENCY_LABEL[urgency]}</span>
              </div>
            </div>
            {gpsPos && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Location</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{gpsPos.lat.toFixed(5)}, {gpsPos.lng.toFixed(5)}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Description</div>
              <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>

          {/* Photo placeholder */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 20, cursor: 'pointer' }}>
            + Add photo (optional)
          </div>

          {/* Notice */}
          <div style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.15)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
            After submission, maintenance team will be notified. Expected: URGENT 30min / IMPORTANT 2h / NORMAL 24h
          </div>

          {/* Back */}
          <button
            onClick={() => setStep(1)}
            style={{ width: '100%', height: 50, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer', marginBottom: 10 }}
          >
            &lt;- Modify
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', height: 56, borderRadius: 14, border: 'none',
              background: submitting ? 'rgba(0,212,170,0.5)' : '#00D4AA',
              color: '#000', fontSize: 18, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {submitting ? 'Submitting...' : '[Submit work order]'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,170,0.4); } 50% { box-shadow: 0 0 0 12px rgba(0,212,170,0); } }
        @keyframes pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,48,0.4); } 50% { box-shadow: 0 0 0 12px rgba(255,59,48,0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
