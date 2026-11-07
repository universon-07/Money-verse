/** Paper bunting strung across the top of the bazaar. */
export function Bunting() {
  const colors = ['#E5457A', '#E8B04A', '#2F6F73', '#F28C28', '#5BB5D6', '#3F7A3A']
  return (
    <svg className="pointer-events-none block h-7 w-full" viewBox="0 0 360 28" preserveAspectRatio="none" aria-hidden>
      <path d="M0 4 Q180 16 360 4" fill="none" stroke="#2B1A17" strokeWidth="1.6" />
      {Array.from({ length: 18 }, (_, i) => {
        const x = 6 + i * 20
        const y = 4 + Math.sin((x / 360) * Math.PI) * 6
        return <path key={i} d={`M${x} ${y} L${x + 14} ${y} L${x + 7} ${y + 13}Z`} fill={colors[i % colors.length]} stroke="#2B1A17" strokeWidth="1.4" strokeLinejoin="round" />
      })}
    </svg>
  )
}

/** Old City rooftops (Charminar in the distance) behind every outdoor screen. */
export function Rooftops({ night = false, className = 'pointer-events-none fixed inset-x-0 bottom-0 h-40 w-full', aspect = 'xMidYMax slice' }: { night?: boolean; className?: string; aspect?: string }) {
  const fill = night ? '#2A3658' : '#E7A86B'
  const back = night ? '#1E2A44' : '#F2C48D'
  return (
    <svg className={className} viewBox="0 0 360 160" preserveAspectRatio={aspect} aria-hidden>
      <g fill={back} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" opacity=".9">
        <path d="M150 160 V96 H210 V160Z" />
        <path d="M156 96 V58 Q158 50 160 58 V96 M200 96 V58 Q202 50 204 58 V96" />
        <path d="M170 96 Q180 74 190 96" fill={night ? '#121A2E' : '#C9875A'} />
        <circle cx="158" cy="52" r="5" />
        <circle cx="202" cy="52" r="5" />
      </g>
      <g fill={fill} stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M0 160 V112 H34 V100 H62 V122 H92 V108 H128 V128 H150 V160Z" />
        <path d="M210 160 V118 H238 V104 H266 V124 H296 V98 H330 V116 H360 V160Z" />
      </g>
      {[[12, 124], [44, 112], [104, 120], [222, 128], [250, 114], [308, 108], [340, 126]].map(([x, y]) => (
        <rect key={x} x={x} y={y} width="8" height="11" fill={night ? '#FFD25A' : '#2B1A17'} opacity={night ? 0.9 : 0.55} />
      ))}
    </svg>
  )
}
