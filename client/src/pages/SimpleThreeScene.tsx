import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function SimpleThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('initializing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const container = mountRef.current
    if (!container) {
      setStatus('error: no container')
      return
    }

    setStatus('container found, width=' + container.clientWidth + ' height=' + container.clientHeight)

    try {
      // 1. Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#0a0e1a')
      setStatus('scene created')

      // 2. Create camera
      const camera = new THREE.PerspectiveCamera(60, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 1000)
      camera.position.set(0, 5, 12)
      camera.lookAt(0, 0, 0)
      setStatus('camera created')

      // 3. Create renderer with explicit canvas
      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.display = 'block'
      canvas.width = container.clientWidth
      canvas.height = Math.max(container.clientHeight, 1)

      const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
      if (!gl) {
        setStatus('error: no webgl context')
        return
      }
      setStatus('webgl context obtained')

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
      renderer.setSize(container.clientWidth, Math.max(container.clientHeight, 1))
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)
      setStatus('renderer mounted, canvas w=' + renderer.domElement.width + ' h=' + renderer.domElement.height)

      // 4. Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambient)
      const dir = new THREE.DirectionalLight(0xffffff, 1.5)
      dir.position.set(10, 15, 10)
      scene.add(dir)
      setStatus('lights added')

      // 5. Ground grid
      const gridHelper = new THREE.GridHelper(80, 16, 0x2a3860, 0x1a2540)
      scene.add(gridHelper)

      const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: '#0d1520' })
      )
      groundMesh.rotation.x = -Math.PI / 2
      scene.add(groundMesh)
      setStatus('ground added')

      // 6. A simple box in center so we can see something immediately
      const boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: '#00D4AA', emissive: '#003322', emissiveIntensity: 0.3 })
      )
      boxMesh.position.set(0, 2, 0)
      scene.add(boxMesh)

      // 7. A yellow marker sphere
      const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#FFD700', emissive: '#554400', emissiveIntensity: 0.5 })
      )
      sphereMesh.position.set(4, 1, 0)
      scene.add(sphereMesh)

      // 8. Building outline
      const buildingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(12, 6, 10),
        new THREE.MeshStandardMaterial({ color: '#1a2040', roughness: 0.8 })
      )
      buildingMesh.position.set(-20, 3, -10)
      scene.add(buildingMesh)

      // 9. Battery cabinet
      const battMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2.5, 1.5),
        new THREE.MeshStandardMaterial({ color: '#0f1a2e', metalness: 0.6 })
      )
      battMesh.position.set(8, 1.25, 0)
      scene.add(battMesh)
      const battIndicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: '#00ff88', emissive: '#00ff88', emissiveIntensity: 1 })
      )
      battIndicator.position.set(8, 2.5, 0.8)
      scene.add(battIndicator)

      setStatus('scene objects added, starting render loop')

      // 10. OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 3
      controls.maxDistance = 80

      // 11. Animation loop
      let animId: number
      let frameCount = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        frameCount++
        boxMesh.rotation.y += 0.01
        controls.update()
        renderer.render(scene, camera)
        if (frameCount === 1) {
          setStatus('first frame rendered! frameCount=' + frameCount)
        }
      }
      animate()
      setStatus('animation started')

      // 12. Resize observer
      const ro = new ResizeObserver(() => {
        if (!container) return
        const w = container.clientWidth
        const h = Math.max(container.clientHeight, 1)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      })
      ro.observe(container)

      return () => {
        cancelAnimationFrame(animId)
        ro.disconnect()
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Three.js init error:', msg)
      setStatus('exception: ' + msg)
      setErrorMsg(msg)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', background: '#080c18', position: 'relative' }}>
      {/* Debug status overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.85)',
        padding: '8px 14px',
        fontSize: 11,
        color: status.includes('error') || status.includes('exception') ? '#FF4D4F' : '#00D4AA',
        zIndex: 20,
        fontFamily: 'monospace',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        🐛 Debug: {status}
      </div>

      {/* Three.js mount point */}
      <div
        ref={mountRef}
        id="three-mount"
        style={{ width: '100%', height: '100%', background: '#0a0e1a' }}
      />

      {errorMsg && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16, right: 16,
          background: 'rgba(255,77,79,0.1)', border: '1px solid #FF4D4F',
          borderRadius: 8, padding: '10px 14px',
          color: '#FF4D4F', fontSize: 12,
        }}>
          ❌ Error: {errorMsg}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 16,
        display: 'flex', gap: 14, fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        zIndex: 5,
      }}>
        <span>🏢 工业建筑</span>
        <span>☀️ 光伏阵列</span>
        <span>🔋 储能</span>
        <span>🚗 充电桩</span>
        <span>🌳 绿化</span>
      </div>
    </div>
  )
}
