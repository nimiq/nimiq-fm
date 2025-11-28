const defaultConfig = {
  // === GEOMETRY ===
  orbRadius: 14,
  nodeCount: 800,

  // === NODE APPEARANCE ===
  peerNodeScale: 0.25,
  validatorNodeScale: 0.9,
  nodeHaloScale: 2.5,
  nodeNoiseAmplitude: 0.05,

  // === TIMING ===
  beamPropagationTimeMs: 1000,
  peerLifetimeMs: 30000,
  peerTransitionMs: 2000,

  // === ANIMATION ===
  validatorRotationSpeed: 0.1,
  groupRotationSpeed: 0.08,
  groupRotationXAmplitude: 0.05,
  groupRotationZAmplitude: 0.025,
  autoRotateSpeed: 0.1,

  // === BEAM EFFECTS ===
  beamWaveWidth: 8.0,
  beamIntensityMultiplier: 0.6,
  beamScaleMultiplier: 1.0,
  beamMaxDistanceMultiplier: 2.2,

  // === VALIDATOR FLASH ===
  flashDuration: 1.5,
  flashGrowTime: 0.8,
  flashScaleMultiplier: 0.35,

  // === LINKS ===
  linkRewireDistance: 6.0,
  linkArchHeight: 0.18,

  // === COLORS ===
  colorBg: '#0f1e3d',
  colorLink: '#64748b',
  beamColor: '#FF9500',
  validatorColor: '#a070e0',
  edgeColor: '#d400ff',
  nodePalette: ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8'],
  nodeEmissiveColor: '#0095FF',
  haloColor: '#0095FF',

  // === LIGHTING ===
  ambientLightIntensity: 0.8,
  mainLightIntensity: 8,
  fillLightIntensity: 4,
  topLightIntensity: 4,

  // === CAMERA ===
  cameraPositionZ: 33,
  cameraFov: 60,
  orbitMinDistance: 15,
  orbitMaxDistance: 100,

  // === POST-PROCESSING ===
  bloom: { threshold: 0.2, intensity: 2.5, radius: 0.85 },
  vignette: { offset: 0.15, darkness: 0.6 },

  // === BACKGROUND EFFECTS ===
  sparklesCount: 80,
  sparklesScale: 45,
  sparklesSize: 3,
  sparklesSpeed: 0.15,
  sparklesOpacity: 0.2,
  starsCount: 800,
  starsRadius: 100,
  starsDepth: 50,
  starsSpeed: 0.05,

  // === MOBILE OPTIMIZATION ===
  mobile: {
    enabled: false,
    maxNodes: 500,
    maxLinks: 500, // Not directly used but good for reference
    curveSegments: 1, // Reduced from 4
    disableBloom: true,
    disableSparkles: true,
    geometryUpdateInterval: 2, // Update every N frames
    simplifiedLighting: true,
  },
}

export type OrbConfig = typeof defaultConfig

const defaultMetrics = {
  fps: 0,
  activeBeams: 0,
  activeNodes: 0,
  connectedLinks: 0,
  nodeUpdateTime: 0,
  linkUpdateTime: 0,
  beamUpdateTime: 0,
  totalFrameTime: 0,
  heapUsed: 0,
  // Mobile specific
  isMobile: false,
  deviceMemory: 0,
  concurrency: 0,
}

export function useOrbConfig() {
  const config = useState<OrbConfig>('orb-debug-config', () => structuredClone(defaultConfig))
  const metrics = useState('orb-metrics', () => ({ ...defaultMetrics }))
  const graphVersion = useState('orb-graph-version', () => 0)

  // Persist to localStorage on client
  if (import.meta.client) {
    const stored = localStorage.getItem('orb-debug-config')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        Object.assign(config.value, parsed)
      }
      catch {}
    }
    watch(config, val => localStorage.setItem('orb-debug-config', JSON.stringify(val)), { deep: true })
  }

  const beamSpeed = computed(() => (config.value.orbRadius * 2.5) / (config.value.beamPropagationTimeMs / 1000))

  function reset() {
    config.value = structuredClone(defaultConfig)
  }

  function resetGroup(group: 'geometry' | 'nodeAppearance' | 'timing' | 'animation' | 'beamEffects' | 'validatorFlash' | 'links' | 'colors' | 'lighting' | 'camera' | 'postProcessing' | 'background' | 'mobile') {
    const d = defaultConfig
    if (group === 'geometry') {
      config.value.orbRadius = d.orbRadius
      config.value.nodeCount = d.nodeCount
    }
    else if (group === 'nodeAppearance') {
      config.value.peerNodeScale = d.peerNodeScale
      config.value.validatorNodeScale = d.validatorNodeScale
      config.value.nodeHaloScale = d.nodeHaloScale
      config.value.nodeNoiseAmplitude = d.nodeNoiseAmplitude
    }
    else if (group === 'timing') {
      config.value.beamPropagationTimeMs = d.beamPropagationTimeMs
      config.value.peerLifetimeMs = d.peerLifetimeMs
      config.value.peerTransitionMs = d.peerTransitionMs
    }
    else if (group === 'animation') {
      config.value.validatorRotationSpeed = d.validatorRotationSpeed
      config.value.groupRotationSpeed = d.groupRotationSpeed
      config.value.groupRotationXAmplitude = d.groupRotationXAmplitude
      config.value.groupRotationZAmplitude = d.groupRotationZAmplitude
      config.value.autoRotateSpeed = d.autoRotateSpeed
    }
    else if (group === 'beamEffects') {
      config.value.beamWaveWidth = d.beamWaveWidth
      config.value.beamIntensityMultiplier = d.beamIntensityMultiplier
      config.value.beamScaleMultiplier = d.beamScaleMultiplier
      config.value.beamMaxDistanceMultiplier = d.beamMaxDistanceMultiplier
    }
    else if (group === 'validatorFlash') {
      config.value.flashDuration = d.flashDuration
      config.value.flashGrowTime = d.flashGrowTime
      config.value.flashScaleMultiplier = d.flashScaleMultiplier
    }
    else if (group === 'links') {
      config.value.linkRewireDistance = d.linkRewireDistance
      config.value.linkArchHeight = d.linkArchHeight
    }
    else if (group === 'colors') {
      config.value.colorBg = d.colorBg
      config.value.colorLink = d.colorLink
      config.value.beamColor = d.beamColor
      config.value.validatorColor = d.validatorColor
      config.value.edgeColor = d.edgeColor
      config.value.nodePalette = [...d.nodePalette]
      config.value.nodeEmissiveColor = d.nodeEmissiveColor
      config.value.haloColor = d.haloColor
    }
    else if (group === 'lighting') {
      config.value.ambientLightIntensity = d.ambientLightIntensity
      config.value.mainLightIntensity = d.mainLightIntensity
      config.value.fillLightIntensity = d.fillLightIntensity
      config.value.topLightIntensity = d.topLightIntensity
    }
    else if (group === 'camera') {
      config.value.cameraPositionZ = d.cameraPositionZ
      config.value.cameraFov = d.cameraFov
      config.value.orbitMinDistance = d.orbitMinDistance
      config.value.orbitMaxDistance = d.orbitMaxDistance
    }
    else if (group === 'postProcessing') {
      config.value.bloom = { ...d.bloom }
      config.value.vignette = { ...d.vignette }
    }
    else if (group === 'background') {
      config.value.sparklesCount = d.sparklesCount
      config.value.sparklesScale = d.sparklesScale
      config.value.sparklesSize = d.sparklesSize
      config.value.sparklesSpeed = d.sparklesSpeed
      config.value.sparklesOpacity = d.sparklesOpacity
      config.value.starsCount = d.starsCount
      config.value.starsRadius = d.starsRadius
      config.value.starsDepth = d.starsDepth
      config.value.starsSpeed = d.starsSpeed
    }
    else if (group === 'mobile') {
      config.value.mobile = { ...d.mobile }
    }
  }

  // Mobile Detection
  if (import.meta.client && !metrics.value.isMobile) {
    const { isMobile } = useDevice()
    const deviceMemory = (navigator as any).deviceMemory || 4
    const concurrency = navigator.hardwareConcurrency || 4

    // Auto-enable mobile mode if low specs or mobile UA
    const isLowEnd = deviceMemory <= 4 || concurrency <= 4

    updateMetrics({
      isMobile,
      deviceMemory,
      concurrency,
    })

    if (isMobile || isLowEnd) {
      // Only auto-apply if not already customized (checking simple flag)
      // For now, we just set the suggestion, we can force it if needed
      if (!localStorage.getItem('orb-debug-config')) {
        config.value.mobile.enabled = true
        config.value.nodeCount = config.value.mobile.maxNodes
        config.value.sparklesCount = 0 // Disable sparkles
        config.value.starsCount = 200 // Reduce stars
      }
    }
  }

  function regenerateGraph() {
    graphVersion.value++
  }

  function updateMetrics(data: Partial<typeof defaultMetrics>) {
    Object.assign(metrics.value, data)
  }

  return { config, metrics, beamSpeed, graphVersion, reset, resetGroup, regenerateGraph, updateMetrics, defaults: defaultConfig }
}
