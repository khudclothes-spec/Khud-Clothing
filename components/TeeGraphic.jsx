import { TEE_PATH } from "@/lib/data";

export function TeeGraphic({ path = TEE_PATH, fill = "#11100E", width = "60%", opacity = 0.9, className = "" }) {
  return (
    <svg className={className} width={width} viewBox="0 0 200 240" fill="none" aria-hidden="true">
      <path d={path} fill={fill} opacity={opacity} />
      {path === TEE_PATH ? <path d="M80 45 L100 55 L120 45 L100 35 Z" fill={fill} opacity="0.18" /> : null}
    </svg>
  );
}
