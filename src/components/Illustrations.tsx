import React from "react";

/**
 * Preserved Trellis brand mark (blue gradient rounded square + 3-node connected graph).
 */
export function TrellisLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[10px] shadow-md shadow-[#2F80ED]/25 shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #4C9AFF 0%, #2F6FE0 100%)",
      }}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7.2 7.3 10.6 15.9M16.8 7.3l-3.4 8.6M7.5 6h9" />
        <circle cx="5" cy="6" r="2.5" />
        <circle cx="19" cy="6" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
      </svg>
    </div>
  );
}

/**
 * Transparent pure-SVG hero vector illustration (blends seamlessly over light canvas + blue gradient banner).
 */
export function HeroLearnerVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 360" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="hero-aura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.48" />
          <stop offset="55%" stopColor="#DBEAFE" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.28" />
          <stop offset="65%" stopColor="#93C5FD" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-amber-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFA33A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFA33A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-blue-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#2F80ED" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#2F80ED" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-hoodie" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="hero-laptop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      <ellipse cx="255" cy="196" rx="175" ry="145" fill="url(#hero-aura)" />
      <ellipse cx="320" cy="128" rx="120" ry="95" fill="url(#hero-halo)" />

      {/* Orbiting knowledge constellation */}
      <path
        d="M 58 212 C 58 84, 210 24, 378 58 C 446 72, 474 138, 434 198"
        stroke="#60A5FA"
        strokeWidth="1.6"
        strokeDasharray="5 5"
        strokeOpacity="0.55"
      />
      <path d="M 42 152 C 92 48, 286 18, 444 108" stroke="#3B82F6" strokeWidth="1.4" strokeOpacity="0.42" />
      <path d="M 98 228 C 122 108, 304 56, 456 154" stroke="#93C5FD" strokeWidth="1.3" strokeOpacity="0.55" />

      <g stroke="#64748B" strokeWidth="1.2" opacity="0.45">
        <line x1="74" y1="150" x2="104" y2="108" />
        <line x1="104" y1="108" x2="138" y2="134" />
        <line x1="104" y1="108" x2="118" y2="72" />
        <line x1="118" y1="72" x2="168" y2="92" />
        <line x1="138" y1="134" x2="168" y2="92" />
        <line x1="332" y1="68" x2="374" y2="44" />
        <line x1="374" y1="44" x2="416" y2="78" />
        <line x1="416" y1="78" x2="384" y2="108" />
        <line x1="332" y1="68" x2="384" y2="108" />
        <line x1="416" y1="78" x2="446" y2="128" />
        <line x1="384" y1="108" x2="408" y2="156" />
      </g>

      <circle cx="138" cy="134" r="16" fill="url(#hero-amber-glow)" />
      <circle cx="416" cy="78" r="18" fill="url(#hero-blue-glow)" />

      <circle cx="74" cy="150" r="5" fill="#2F80ED" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="104" cy="108" r="4.5" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.8" />
      <circle cx="138" cy="134" r="5.5" fill="#FFA33A" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="118" cy="72" r="4.2" fill="#0D9468" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="168" cy="92" r="4.8" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="332" cy="68" r="4.8" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.8" />
      <circle cx="374" cy="44" r="5.2" fill="#0D9468" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="416" cy="78" r="6.2" fill="#2F80ED" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="384" cy="108" r="5.2" fill="#FFA33A" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="446" cy="128" r="4.2" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.8" />
      <circle cx="408" cy="156" r="4.8" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.8" />

      {/* Chair */}
      <rect x="144" y="184" width="72" height="92" rx="18" fill="#334155" />
      <rect x="152" y="192" width="56" height="76" rx="14" fill="#475569" />
      <rect x="172" y="272" width="16" height="62" rx="4" fill="#1E293B" />
      <rect x="146" y="330" width="68" height="10" rx="5" fill="#1E293B" />

      {/* Learner character */}
      <path d="M 190 274 L 284 274 L 274 342 L 246 342 L 242 294 L 216 342 L 186 342 Z" fill="#0F172A" />
      <path d="M 170 256 C 170 202, 198 182, 238 182 C 276 182, 304 202, 306 256 Z" fill="url(#hero-hoodie)" />
      <path d="M 206 184 C 216 168, 256 168, 266 184 C 254 196, 218 196, 206 184 Z" fill="#D97706" />
      <line x1="225" y1="192" x2="223" y2="218" stroke="#FEF3C7" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="248" y1="192" x2="250" y2="216" stroke="#FEF3C7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 176 238 C 172 252, 186 258, 222 256 L 230 244 L 194 238 Z" fill="#EA580C" />
      <path d="M 278 216 L 292 252 L 266 254 L 258 214 Z" fill="#F59E0B" />
      <path d="M 256 238 L 272 192 L 286 196 L 272 246 Z" fill="#D97706" />
      <circle cx="272" cy="178" r="9.5" fill="#F6C39E" />
      <rect x="229" y="158" width="18" height="26" rx="8" fill="#E8AE85" />
      <path d="M 229 166 Q 238 175 247 166 L 247 160 L 229 160 Z" fill="#D49468" />
      <circle cx="211" cy="138" r="7.5" fill="#E8AE85" />
      <circle cx="265" cy="138" r="7.5" fill="#E8AE85" />
      <ellipse cx="238" cy="135" rx="27" ry="31" fill="#F6C39E" />
      <ellipse cx="223" cy="144" rx="5.5" ry="3.2" fill="#F4978E" fillOpacity="0.35" />
      <ellipse cx="253" cy="144" rx="5.5" ry="3.2" fill="#F4978E" fillOpacity="0.35" />
      <path d="M 221 124 Q 227 120 233 123" stroke="#1E293B" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M 244 123 Q 250 120 256 124" stroke="#1E293B" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="227" cy="134" r="2.7" fill="#0F172A" />
      <circle cx="250" cy="134" r="2.7" fill="#0F172A" />
      <circle cx="228" cy="133" r="0.9" fill="#FFFFFF" />
      <circle cx="251" cy="133" r="0.9" fill="#FFFFFF" />
      <path d="M 237 136 L 239 144 L 235 145" stroke="#D49468" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M 231 153 Q 239 158 247 152" stroke="#B45309" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M 208 134 C 204 102, 224 92, 244 94 C 266 96, 272 114, 267 136 C 262 118, 252 114, 238 115 C 224 116, 214 120, 208 134 Z"
        fill="#0F172A"
      />
      <path d="M 218 98 C 230 88, 254 90, 262 102 C 250 98, 232 98, 218 98 Z" fill="#1E293B" />

      {/* Desk, laptop, open textbook & Erlenmeyer flask */}
      <rect x="42" y="254" width="418" height="16" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="46" y="270" width="410" height="7" rx="3" fill="#CBD5E1" />
      <rect x="74" y="277" width="10" height="74" rx="4" fill="#94A3B8" />
      <rect x="418" y="277" width="10" height="74" rx="4" fill="#94A3B8" />

      <path d="M 278 248 L 296 184 L 382 184 L 368 248 Z" fill="url(#hero-laptop)" stroke="#1E40AF" strokeWidth="1.4" />
      <path d="M 244 254 L 278 246 L 368 246 L 344 254 Z" fill="#475569" />
      <line x1="326" y1="208" x2="338" y2="208" stroke="#E0F2FE" strokeWidth="1.4" />
      <line x1="326" y1="208" x2="332" y2="222" stroke="#E0F2FE" strokeWidth="1.4" />
      <line x1="338" y1="208" x2="332" y2="222" stroke="#E0F2FE" strokeWidth="1.4" />
      <circle cx="326" cy="208" r="2.5" fill="#FFFFFF" />
      <circle cx="338" cy="208" r="2.5" fill="#FFFFFF" />
      <circle cx="332" cy="222" r="2.5" fill="#FFA33A" />

      <path
        d="M 222 252 Q 254 244 282 252 Q 310 244 342 252 L 346 263 Q 312 255 282 263 Q 252 255 218 263 Z"
        fill="#1E3A8A"
      />
      <path
        d="M 226 248 Q 256 238 282 248 L 282 259 Q 256 249 224 259 Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
      <path
        d="M 282 248 Q 308 238 338 248 L 340 259 Q 308 249 282 259 Z"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
      <line x1="236" y1="248" x2="272" y2="249" stroke="#94A3B8" strokeWidth="1.2" />
      <line x1="235" y1="253" x2="270" y2="253" stroke="#CBD5E1" strokeWidth="1.2" />
      <line x1="292" y1="249" x2="326" y2="248" stroke="#94A3B8" strokeWidth="1.2" />
      <line x1="292" y1="253" x2="322" y2="253" stroke="#CBD5E1" strokeWidth="1.2" />

      <path
        d="M 402 198 L 414 198 L 414 214 L 430 246 Q 432 254 424 254 L 392 254 Q 384 254 386 246 L 402 214 Z"
        fill="#E0F2FE"
        stroke="#0284C7"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <path
        d="M 392 232 L 424 232 L 429 246 Q 431 253 423 253 L 393 253 Q 385 253 387 246 Z"
        fill="#38BDF8"
        opacity="0.82"
      />
      <rect x="399" y="194" width="18" height="5" rx="2.5" fill="#0284C7" />
      <circle cx="404" cy="242" r="2.5" fill="#FFFFFF" opacity="0.85" />
      <circle cx="412" cy="237" r="2.0" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

/**
 * Transparent pure-SVG explorer student with golden compass & constellation tree.
 */
export function EmptyExplorerVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 260" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="emp-node-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFA33A" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#FFA33A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="emp-comp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFA33A" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#FCD34D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFA33A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d="M 28 156 C 14 102, 58 46, 128 52 C 186 56, 206 16, 254 32 C 296 46, 294 122, 266 172 C 242 216, 174 226, 108 218 C 52 212, 38 196, 28 156 Z"
        fill="#EAF2FF"
        fillOpacity="0.85"
      />
      <ellipse cx="216" cy="118" rx="66" ry="74" fill="#DBEAFE" fillOpacity="0.42" />
      <ellipse cx="78" cy="238" rx="42" ry="8" fill="#CBD5E1" fillOpacity="0.55" />

      <g stroke="#60A5FA" strokeWidth="1.4" opacity="0.65">
        <line x1="204" y1="192" x2="178" y2="152" />
        <line x1="204" y1="192" x2="232" y2="150" />
        <line x1="178" y1="152" x2="166" y2="106" />
        <line x1="178" y1="152" x2="210" y2="116" />
        <line x1="232" y1="150" x2="210" y2="116" />
        <line x1="232" y1="150" x2="258" y2="114" />
        <line x1="210" y1="116" x2="192" y2="66" />
        <line x1="210" y1="116" x2="242" y2="68" />
        <line x1="166" y1="106" x2="192" y2="66" />
        <line x1="258" y1="114" x2="242" y2="68" />
      </g>

      <circle cx="210" cy="116" r="16" fill="url(#emp-node-glow)" />
      <circle cx="204" cy="192" r="5.5" fill="#2F80ED" stroke="#FFFFFF" strokeWidth="1.6" />
      <circle cx="178" cy="152" r="5" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.6" />
      <circle cx="232" cy="150" r="5" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.6" />
      <circle cx="166" cy="106" r="5" fill="#0D9468" stroke="#FFFFFF" strokeWidth="1.6" />
      <circle cx="210" cy="116" r="6.5" fill="#FFA33A" stroke="#FFFFFF" strokeWidth="1.6" />
      <circle cx="258" cy="114" r="4.5" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.6" />
      <circle cx="192" cy="66" r="4.8" fill="#FFFFFF" stroke="#2F80ED" strokeWidth="1.6" />
      <circle cx="242" cy="68" r="5.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.6" />

      <rect x="42" y="92" width="24" height="50" rx="10" fill="#1E293B" />
      <circle cx="52" cy="110" r="5.5" fill="#FFFFFF" fillOpacity="0.85" />
      <circle cx="52" cy="110" r="2.2" fill="#2F80ED" />
      <rect x="61" y="162" width="14" height="62" rx="5" fill="#E5D3B3" />
      <rect x="81" y="162" width="14" height="62" rx="5" fill="#D8C29D" />
      <path d="M 58 222 L 77 222 L 79 236 L 54 236 Q 52 228 58 222 Z" fill="#334155" />
      <path d="M 79 222 L 99 222 L 103 236 L 78 236 Q 76 228 79 222 Z" fill="#475569" />
      <path d="M 54 96 C 54 84, 98 84, 102 98 L 104 166 L 54 166 Z" fill="#1E3A8A" />
      <rect x="71" y="90" width="18" height="66" rx="3" fill="#2F80ED" />
      <circle cx="54" cy="58" r="12" fill="#1E293B" />
      <circle cx="47" cy="68" r="9" fill="#0F172A" />
      <circle cx="78" cy="56" r="20" fill="#0F172A" />
      <ellipse cx="80" cy="62" rx="16" ry="18" fill="#D99B78" />
      <path d="M 64 56 C 66 44, 94 42, 96 58 C 88 52, 74 52, 64 56 Z" fill="#1E293B" />
      <circle cx="76" cy="61" r="1.9" fill="#0F172A" />
      <circle cx="87" cy="61" r="1.9" fill="#0F172A" />
      <path d="M 78 69 Q 83 73 88 69" stroke="#7C2D12" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 94 102 L 128 118 L 122 130 L 86 116 Z" fill="#1E40AF" />
      <circle cx="130" cy="122" r="6.5" fill="#D99B78" />

      <circle cx="138" cy="118" r="24" fill="url(#emp-comp-glow)" />
      <circle cx="138" cy="118" r="13" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="138" cy="118" r="9.5" fill="#FFFBEB" />
      <path d="M 138 111 L 141 118 L 138 125 L 135 118 Z" fill="#E11D48" />
      <path d="M 138 111 L 141 118 L 135 118 Z" fill="#F97316" />
      <circle cx="138" cy="118" r="1.6" fill="#1E293B" />
    </svg>
  );
}

/**
 * Transparent pure-SVG stacked books + glowing star for Create Vault modal header.
 */
export function BooksStackVector({ className = "w-32 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="bks-bg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.65" />
          <stop offset="70%" stopColor="#EFF6FF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bks-star" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFA33A" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="104" cy="68" rx="86" ry="56" fill="url(#bks-bg)" />
      <ellipse cx="104" cy="118" rx="72" ry="8" fill="#CBD5E1" fillOpacity="0.45" />

      <rect x="34" y="92" width="136" height="22" rx="6" fill="#1E3A8A" />
      <rect x="46" y="96" width="120" height="14" rx="3" fill="#FFFFFF" />
      <rect x="34" y="92" width="18" height="22" rx="5" fill="#172554" />
      <path d="M 142 114 L 142 126 L 148 122 L 154 126 L 154 114 Z" fill="#E11D48" />

      <rect x="42" y="70" width="128" height="22" rx="6" fill="#0D9468" />
      <rect x="54" y="74" width="112" height="14" rx="3" fill="#F8FAFC" />
      <rect x="42" y="70" width="18" height="22" rx="5" fill="#047857" />

      <rect x="36" y="48" width="132" height="22" rx="6" fill="#2F80ED" />
      <rect x="48" y="52" width="116" height="14" rx="3" fill="#FFFFFF" />
      <rect x="36" y="48" width="18" height="22" rx="5" fill="#1D4ED8" />
      <line x1="74" y1="57" x2="138" y2="57" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />

      <circle cx="102" cy="24" r="26" fill="url(#bks-star)" />
      <path
        d="M 102 6 L 107.6 17.5 L 120.2 19.3 L 111.1 28.2 L 113.2 40.8 L 102 34.8 L 90.8 40.8 L 92.9 28.2 L 83.8 19.3 L 96.4 17.5 Z"
        fill="#FFA33A"
        stroke="#D97706"
        strokeWidth="1.2"
      />
      <circle cx="54" cy="28" r="3.8" fill="#2F80ED" />
      <circle cx="148" cy="26" r="4.2" fill="#7C3AED" />
      <circle cx="162" cy="42" r="3.0" fill="#0D9468" />
    </svg>
  );
}
