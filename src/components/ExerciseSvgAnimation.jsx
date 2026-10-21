import React from 'react';

export default function ExerciseSvgAnimation({ type }) {
  switch (type) {
    case 'bench':
      return (
        <svg viewBox="0 0 240 140" className="w-full h-40 bg-[#F6F6F7] rounded-lg border border-[#D9DDE2]">
          {/* Bench */}
          <rect x="35" y="98" width="170" height="10" fill="#2B3037" rx="2" />
          <rect x="55" y="108" width="10" height="22" fill="#15171A" />
          <rect x="175" y="108" width="10" height="22" fill="#15171A" />
          {/* Lifter Torso & Head */}
          <path d="M55 98 Q100 94 140 98" stroke="#555B63" strokeWidth="10" strokeLinecap="round" />
          <circle cx="50" cy="95" r="7" fill="#15171A" />
          {/* Bar Path Guideline */}
          <line x1="100" y1="36" x2="100" y2="86" stroke="#FFAE00" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
          {/* Moving Barbell */}
          <g>
            <line x1="75" y1="40" x2="125" y2="40" stroke="#15171A" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="y1" values="40;84;40" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="y2" values="40;84;40" dur="2.6s" repeatCount="indefinite" />
            </line>
            {/* Plates */}
            <rect x="78" y="28" width="5" height="24" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="28;72;28" dur="2.6s" repeatCount="indefinite" />
            </rect>
            <rect x="117" y="28" width="5" height="24" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="28;72;28" dur="2.6s" repeatCount="indefinite" />
            </rect>
          </g>
          <text x="12" y="20" fill="#555B63" fontSize="9" fontFamily="monospace" fontWeight="600">BAR PATH: CONTROLLED STERNUM TOUCH</text>
        </svg>
      );

    case 'squat':
      return (
        <svg viewBox="0 0 240 140" className="w-full h-40 bg-[#F6F6F7] rounded-lg border border-[#D9DDE2]">
          {/* Floor */}
          <line x1="20" y1="125" x2="220" y2="125" stroke="#D9DDE2" strokeWidth="2" />
          {/* Depth Guideline */}
          <line x1="120" y1="28" x2="120" y2="88" stroke="#FFAE00" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
          {/* Lifter Body */}
          <circle cx="120" cy="38" r="7" fill="#15171A">
            <animate attributeName="cy" values="38;74;38" dur="3s" repeatCount="indefinite" />
          </circle>
          <path d="M120 45 L120 75 L108 100 L108 125" stroke="#555B63" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <animate attributeName="d" values="M120 45 L120 75 L108 100 L108 125; M120 81 L120 95 L95 110 L95 125; M120 45 L120 75 L108 100 L108 125" dur="3s" repeatCount="indefinite" />
          </path>
          {/* Barbell on Traps */}
          <g>
            <line x1="95" y1="44" x2="145" y2="44" stroke="#15171A" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="y1" values="44;80;44" dur="3s" repeatCount="indefinite" />
              <animate attributeName="y2" values="44;80;44" dur="3s" repeatCount="indefinite" />
            </line>
            <rect x="98" y="32" width="6" height="24" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="32;68;32" dur="3s" repeatCount="indefinite" />
            </rect>
            <rect x="136" y="32" width="6" height="24" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="32;68;32" dur="3s" repeatCount="indefinite" />
            </rect>
          </g>
          <text x="12" y="20" fill="#555B63" fontSize="9" fontFamily="monospace" fontWeight="600">DEPTH: HIP CREASE BELOW PARALLEL</text>
        </svg>
      );

    case 'deadlift':
      return (
        <svg viewBox="0 0 240 140" className="w-full h-40 bg-[#F6F6F7] rounded-lg border border-[#D9DDE2]">
          <line x1="20" y1="125" x2="220" y2="125" stroke="#D9DDE2" strokeWidth="2" />
          <line x1="120" y1="52" x2="120" y2="116" stroke="#FFAE00" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
          {/* Lifter Body */}
          <circle cx="120" cy="40" r="7" fill="#15171A" />
          <path d="M120 47 L120 78 L110 102 L110 125" stroke="#555B63" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Moving Barbell off Floor */}
          <g>
            <line x1="95" y1="116" x2="145" y2="116" stroke="#15171A" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="y1" values="116;60;116" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="116;60;116" dur="3.2s" repeatCount="indefinite" />
            </line>
            <circle cx="100" cy="116" r="10" fill="#FFAE00">
              <animate attributeName="cy" values="116;60;116" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="116" r="10" fill="#FFAE00">
              <animate attributeName="cy" values="116;60;116" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </g>
          <text x="12" y="20" fill="#555B63" fontSize="9" fontFamily="monospace" fontWeight="600">VERTICAL SHIN PATH & GLUTE LOCKOUT</text>
        </svg>
      );

    case 'ohp':
      return (
        <svg viewBox="0 0 240 140" className="w-full h-40 bg-[#F6F6F7] rounded-lg border border-[#D9DDE2]">
          <line x1="20" y1="125" x2="220" y2="125" stroke="#D9DDE2" strokeWidth="2" />
          <circle cx="120" cy="60" r="7" fill="#15171A" />
          <path d="M120 67 L120 100 L114 125" stroke="#555B63" strokeWidth="6" strokeLinecap="round" fill="none" />
          <line x1="120" y1="30" x2="120" y2="68" stroke="#FFAE00" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
          <g>
            <line x1="95" y1="68" x2="145" y2="68" stroke="#15171A" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="y1" values="68;26;68" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="y2" values="68;26;68" dur="2.8s" repeatCount="indefinite" />
            </line>
            <rect x="98" y="58" width="5" height="20" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="58;16;58" dur="2.8s" repeatCount="indefinite" />
            </rect>
            <rect x="137" y="58" width="5" height="20" fill="#FFAE00" rx="1">
              <animate attributeName="y" values="58;16;58" dur="2.8s" repeatCount="indefinite" />
            </rect>
          </g>
          <text x="12" y="20" fill="#555B63" fontSize="9" fontFamily="monospace" fontWeight="600">OVERHEAD VERTICAL STACK OVER SPINE</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 240 140" className="w-full h-40 bg-[#F6F6F7] rounded-lg border border-[#D9DDE2]">
          <circle cx="120" cy="55" r="16" fill="#FEF2F2" stroke="#FFAE00" strokeWidth="2" />
          <path d="M120 71 L120 105" stroke="#15171A" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 85 L140 85" stroke="#FFAE00" strokeWidth="4" strokeLinecap="round">
            <animate attributeName="transform" type="rotate" values="-10 120 85; 10 120 85; -10 120 85" dur="2.5s" repeatCount="indefinite" />
          </path>
          <text x="12" y="20" fill="#555B63" fontSize="9" fontFamily="monospace" fontWeight="600">BIOMECHANICAL TENSION & CADENCE</text>
        </svg>
      );
  }
}
