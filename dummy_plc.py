import time
import random

# =========================
# PLC TAG DATABASE
# =========================

tags = {
    # RUN STATES
    "E1_RUN": False,
    "E2_RUN": False,
    "E3_RUN": False,
    "E4_RUN": False,

    "CC1_RUN": False,
    "CLASSIFIER_RUN": False,
    "DESTONER_RUN": False,
    "HULLING_RUN": False,

    # SWITCHES
    "SW1": False,   # BIN1 -> CC1
    "SW2": False,   # BIN2 -> CC1
    "SW3": False,   # BIN3 -> CLASSIFIER enable
    "SW4": False,   # BIN4 -> DESTONER enable

    # BIN LEVELS (0–100)
    "BIN1_LEVEL": 0.0,
    "BIN2_LEVEL": 0.0,
    "BIN3_LEVEL": 0.0,
    "BIN4_LEVEL": 0.0,
    "BIN5_LEVEL": 0.0,

    # DUST FLOWS
    "DUST1_FLOW": False,
    "DUST2_FLOW": False,
    "DUST3_FLOW": False,

    # ALARMS
    "ALM_BIN1_FULL": False,
    "ALM_BIN2_FULL": False,
    "ALM_BIN3_FULL": False,
    "ALM_BIN4_FULL": False,
    "ALM_BIN5_FULL": False,

    "ALM_CLASSIFIER_BLOCKED": False,
    "ALM_DESTONER_BLOCKED": False,

    # TELEMETRY
    **{f"E{i}_SPEED": 0 for i in range(1, 5)},
    **{f"E{i}_HOURS": 0.0 for i in range(1, 5)},
    **{f"E{i}_IDLE": 0.0 for i in range(1, 5)},
}

# =========================
# THROUGHPUT SETTINGS
# =========================
E1_RATE = 1
CC1_RATE = 1
CLASSIFIER_RATE = 2
DESTONER_RATE = 2
E3_RATE = 2
E4_RATE = 2

# =========================
# PLC SCAN LOOP
# =========================

def plc_loop():
    while True:

        # -------------------------
        # Elevator Telemetry
        # -------------------------
        for i in range(1, 5):
            if tags[f"E{i}_RUN"]:
                tags[f"E{i}_SPEED"] = random.randint(900, 1100)
                tags[f"E{i}_HOURS"] += 0.01
            else:
                tags[f"E{i}_SPEED"] = 0
                tags[f"E{i}_IDLE"] += 0.01

        # -------------------------
        # BIN FULL ALARMS
        # -------------------------
        for i in range(1, 6):
            tags[f"ALM_BIN{i}_FULL"] = tags[f"BIN{i}_LEVEL"] >= 100

        # -------------------------
        # E1 → BIN1 & BIN2
        # -------------------------
        if tags["E1_RUN"]:
            if not tags["ALM_BIN1_FULL"]:
                tags["BIN1_LEVEL"] = min(100, tags["BIN1_LEVEL"] + E1_RATE)
            if not tags["ALM_BIN2_FULL"]:
                tags["BIN2_LEVEL"] = min(100, tags["BIN2_LEVEL"] + E1_RATE)

        # -------------------------
        # BIN1 → CC1 → E2 → BIN3
        # -------------------------
        if tags["CC1_RUN"] and tags["SW1"] and tags["BIN1_LEVEL"] > 0 and tags["E2_RUN"]:
            tags["BIN1_LEVEL"] -= CC1_RATE
            if not tags["ALM_BIN3_FULL"]:
                tags["BIN3_LEVEL"] = min(100, tags["BIN3_LEVEL"] + CC1_RATE)

        # -------------------------
        # BIN2 → CC1 → E2 → BIN3
        # -------------------------
        if tags["CC1_RUN"] and tags["SW2"] and tags["BIN2_LEVEL"] > 0 and tags["E2_RUN"]:
            tags["BIN2_LEVEL"] -= CC1_RATE
            if not tags["ALM_BIN3_FULL"]:
                tags["BIN3_LEVEL"] = min(100, tags["BIN3_LEVEL"] + CC1_RATE)

        # -------------------------
        # BIN3 → CLASSIFIER
        # -------------------------
        tags["DUST1_FLOW"] = False
        tags["ALM_CLASSIFIER_BLOCKED"] = False

        if (
            tags["CLASSIFIER_RUN"]
            and tags["SW3"]
            and tags["BIN3_LEVEL"] > 0
            and tags["E3_RUN"]
        ):
            if tags["ALM_BIN4_FULL"]:
                tags["ALM_CLASSIFIER_BLOCKED"] = True
            else:
                tags["BIN3_LEVEL"] -= CLASSIFIER_RATE

                if random.random() < 0.7:
                    tags["BIN4_LEVEL"] = min(100, tags["BIN4_LEVEL"] + CLASSIFIER_RATE)
                else:
                    tags["DUST1_FLOW"] = True

        # -------------------------
        # BIN4 → DESTONER
        # -------------------------
        tags["DUST2_FLOW"] = False
        tags["ALM_DESTONER_BLOCKED"] = False

        if (
            tags["DESTONER_RUN"]
            and tags["SW4"]
            and tags["BIN4_LEVEL"] > 0
            and tags["E4_RUN"]
        ):
            if tags["ALM_BIN5_FULL"]:
                tags["ALM_DESTONER_BLOCKED"] = True
            else:
                tags["BIN4_LEVEL"] -= DESTONER_RATE

                if random.random() < 0.75:
                    tags["BIN5_LEVEL"] = min(100, tags["BIN5_LEVEL"] + DESTONER_RATE)
                else:
                    tags["DUST2_FLOW"] = True

        # -------------------------
        # BIN5 → HULLING
        # -------------------------
        if tags["HULLING_RUN"] and tags["BIN5_LEVEL"] > 0:
            tags["BIN5_LEVEL"] -= 1

        # -------------------------
        # DUST3 (random loss)
        # -------------------------
        tags["DUST3_FLOW"] = (
            any(tags[f"E{i}_RUN"] for i in range(1, 5))
            and random.random() < 0.1
        )

        # -------------------------
        # PLC SCAN
        # -------------------------
        time.sleep(1)
