export const MU_CATEGORIES = [
  {
    name: "ADAV",
    ids: [
      "6a1433a6e358163bcc042e66",
      "6a01709db4d8ad602da528d1",
      "69e7361fe64f9fd7290ea13f",
      "69d4b35c8398ca06c2c90e27",
      "69c14f8cd5ce26e135078c85",
      "69baa442643e58798d240be6",
      "6a09b7ca5cef6005e441a883",
    ],
  },
  {
    name: "BDM",
    ids: [
      "69d35fac0eafd3d295076648",
      "69bd8b61e72e389dfa0574dd",
      "6a01b1c2d6f1a1f7e06b658a",
      "69e9bfa1c8894826c21aa030",
      "69c3bad0cbdcd4950c8d9f41",
      "6a2674a5b0924b6f4dcfc2f0"
    ],
  },
  {
    name: "unalligned",
    ids: [
      "698fa2d4a6b2401a1fc4db25",
    ],
  },
]

export const MU_IDS = MU_CATEGORIES.flatMap((c) => c.ids)

export const GATEWAY_URL = "https://gateway.warerastats.io/trpc/"
export const FALLBACK_URL = "https://api2.warera.io/trpc/"
