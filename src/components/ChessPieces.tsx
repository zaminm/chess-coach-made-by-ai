import React from "react";

interface PieceProps {
  type: "p" | "n" | "b" | "r" | "q" | "k";
  color: "w" | "b";
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className = "w-full h-full" }) => {
  const isWhite = color === "w";
  const fill = isWhite ? "#FFFFFF" : "#1E293B";
  const stroke = isWhite ? "#334155" : "#0F172A";
  const strokeWidth = 1.5;

  switch (type) {
    case "p":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      );
    case "n":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 9.5,23.5 12,18 c 1,-2.5 3.5,-3 5.5,-1.5 1.5,1 2,2.5 1.5,4.5 1.5,-1.5 3.5,-2 5.5,-1.5 2,0.5 3,2 2,4 -1,2 -3,2.5 -5,1.5"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle cx="20" cy="14" r="1.5" fill={isWhite ? "#000" : "#FFF"} />
        </svg>
      );
    case "b":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
            <path d="M 17.5,26 C 15,22.5 16,16 22.5,13 C 29,16 30,22.5 27.5,26 C 22.5,26 22.5,26 17.5,26 z" />
            <path d="M 20,17 L 25,17 M 22.5,14.5 L 22.5,20.5" stroke={stroke} />
          </g>
        </svg>
      );
    case "r":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14 z" />
            <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17 z" />
            <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5 z" />
          </g>
        </svg>
      );
    case "q":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(-1,-1)" />
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(15.5,-5.5)" />
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(32,-1)" />
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(7,-4.5)" />
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(24,-4.5)" />
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 12,36 28,36 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
            <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
          </g>
        </svg>
      );
    case "k":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.63 L 22.5,6" />
            <path d="M 20,8 L 25,8" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
            <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,30 36.5,28.5 36.5,24 C 34,26.5 31,27.5 28.5,27.5 C 25.5,27.5 24,25.5 22.5,25.5 C 21,25.5 19.5,27.5 16.5,27.5 C 14,27.5 11,26.5 8.5,24 C 8.5,28.5 8.5,30 11.5,37 z" />
            <path d="M 11.5,30 C 17,27 28,27 33.5,30" fill="none" />
            <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" fill="none" />
            <path d="M 11.5,37 C 17,34 28,34 33.5,37" fill="none" />
          </g>
        </svg>
      );
    default:
      return null;
  }
};
