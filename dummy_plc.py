import time
import random

# =========================
# PLC TAG DATABASE
# =========================

tags = {

    # =========================
    # COMMANDS (from SCADA)
    # =========================
    "E1_CMD_START": False,
    "E1_CMD_STOP": False,
    "E2_CMD_START": False,
    "E2_CMD_STOP": False,
    "E3_CMD_START": False,
    "E3_CMD_STOP": False,
    "E4_CMD_START": False,
    "E4_CMD_STOP": False,

    "CC1_CMD_START": False,
    "CC1_CMD_STOP": False,
    "CLASSIFIER_CMD_START": False,
    "CLASSIFIER_CMD_STOP": False,
    "DESTONER_CMD_START": False,
    "DESTONER_CMD_STOP": False,
    "HULLING_CMD_START": False,
    "HULLING_CMD_STOP": False,

    # =========================
    # RUN FEEDBACK
    # =========================
    "E1_RUN": False,
    "E2_RUN": False,
    "E3_RUN": False,
    "E4_RUN": False,

    "CC1_RUN": False,
    "CLASSIFIER_RUN": False,
    "DESTONER_RUN": False,
    "HULLING_RUN": False,

    # -------------------------
    # SWITCHES
    # -------------------------
    "SW1": False,
    "SW2": False,
    "SW3": False,
    "SW4": False,

    # -------------------------
    # BIN LEVELS (0–100)
    # -------------------------
    "BIN1_LEVEL": 0.0,
    "BIN2_LEVEL": 0.0,
    "BIN3_LEVEL": 0.0,
    "BIN4_LEVEL": 0.0,
    "BIN5_LEVEL": 0.0,

    # -------------------------
    # DUST FLOWS
    # -------------------------
    "DUST1_FLOW": False,   # Pre-cleaner
    "DUST2_FLOW": False,   # Destoner
    "DUST3_FLOW": False,   # General loss
    "DUST4_FLOW": False,   # CC1
    "DUST5_FLOW": False,   # Pre-cleaner
    "DUST6_FLOW": False,   # Pre-cleaner

    # -------------------------
    # BLOWERS
    # -------------------------
    "BLOWER_RUN": False,
    "DESTONER_BLOWER_RUN": False,

    # -------------------------
    # ALARMS
    # -------------------------
    "ALM_BIN1_FULL": False,
    "ALM_BIN2_FULL": False,
    "ALM_BIN3_FULL": False,
    "ALM_BIN4_FULL": False,
    "ALM_BIN5_FULL": False,

    "ALM_CLASSIFIER_BLOCKED": False,
    "ALM_DESTONER_BLOCKED": False,
}

# =========================
# THROUGHPUT RATES
# =========================
E1_RATE = 1
CC1_RATE = 1
CLASSIFIER_RATE = 2
DESTONER_RATE = 2
HULLING_RATE = 1

# =========================
# PLC SCAN LOOP
# =========================

def plc_loop():
    while True:

        # =====================================================
        # COMMAND → RUN FEEDBACK (MUST BE FIRST)
        # =====================================================

        for m in ["E1", "E2", "E3", "E4"]:
            if tags.get(f"{m}_CMD_START"):
                tags[f"{m}_RUN"] = True
                tags[f"{m}_CMD_START"] = False   # reset like real PLC

            if tags.get(f"{m}_CMD_STOP"):
                tags[f"{m}_RUN"] = False
                tags[f"{m}_CMD_STOP"] = False


        if tags.get("CC1_CMD_START"):
            tags["CC1_RUN"] = True
            tags["CC1_CMD_START"] = False

        if tags.get("CC1_CMD_STOP"):
            tags["CC1_RUN"] = False
            tags["CC1_CMD_STOP"] = False


        if tags.get("CLASSIFIER_CMD_START"):
            tags["CLASSIFIER_RUN"] = True
            tags["CLASSIFIER_CMD_START"] = False

        if tags.get("CLASSIFIER_CMD_STOP"):
            tags["CLASSIFIER_RUN"] = False
            tags["CLASSIFIER_CMD_STOP"] = False


        if tags.get("DESTONER_CMD_START"):
            tags["DESTONER_RUN"] = True
            tags["DESTONER_CMD_START"] = False

        if tags.get("DESTONER_CMD_STOP"):
            tags["DESTONER_RUN"] = False
            tags["DESTONER_CMD_STOP"] = False


        if tags.get("HULLING_CMD_START"):
            tags["HULLING_RUN"] = True
            tags["HULLING_CMD_START"] = False

        if tags.get("HULLING_CMD_STOP"):
            tags["HULLING_RUN"] = False
            tags["HULLING_CMD_STOP"] = False
            
        # -------------------------
        # BIN FULL ALARMS
        # -------------------------
        for i in range(1, 6):
            tags[f"ALM_BIN{i}_FULL"] = tags[f"BIN{i}_LEVEL"] >= 100

        # =====================================================
        # E1 → BIN1 & BIN2
        # =====================================================
        if tags["E1_RUN"]:
            if not tags["ALM_BIN1_FULL"]:
                tags["BIN1_LEVEL"] = min(100, tags["BIN1_LEVEL"] + E1_RATE)
            if not tags["ALM_BIN2_FULL"]:
                tags["BIN2_LEVEL"] = min(100, tags["BIN2_LEVEL"] + E1_RATE)

        # =====================================================
        # BIN1 / BIN2 → CC1 → E2 → BIN3
        # =====================================================
        tags["DUST4_FLOW"] = False

        if tags["CC1_RUN"] and tags["E2_RUN"] and not tags["ALM_BIN3_FULL"]:
            if tags["SW1"] and tags["BIN1_LEVEL"] > 0:
                tags["BIN1_LEVEL"] -= CC1_RATE
                tags["BIN3_LEVEL"] += CC1_RATE
                tags["DUST4_FLOW"] = True

            if tags["SW2"] and tags["BIN2_LEVEL"] > 0:
                tags["BIN2_LEVEL"] -= CC1_RATE
                tags["BIN3_LEVEL"] += CC1_RATE
                tags["DUST4_FLOW"] = True

        # =====================================================
        # BIN3 → PRE-CLEANER 1 → E3 → BIN4
        # =====================================================
        tags["DUST1_FLOW"] = False
        tags["DUST5_FLOW"] = False
        tags["DUST6_FLOW"] = False
        tags["BLOWER_RUN"] = False
        tags["ALM_CLASSIFIER_BLOCKED"] = False

        if (
            tags["CLASSIFIER_RUN"]
            and tags["E3_RUN"]
            and tags["SW3"]
            and tags["BIN3_LEVEL"] > 0
        ):
            tags["BLOWER_RUN"] = True

            if tags["ALM_BIN4_FULL"]:
                tags["ALM_CLASSIFIER_BLOCKED"] = True
            else:
                tags["BIN3_LEVEL"] -= CLASSIFIER_RATE

                if random.random() < 0.7:
                    tags["BIN4_LEVEL"] += CLASSIFIER_RATE
                else:
                    # Multiple dust outlets
                    tags["DUST1_FLOW"] = True
                    tags["DUST5_FLOW"] = True
                    tags["DUST6_FLOW"] = True

        # =====================================================
        # BIN4 → DESTONER → E4 → BIN5
        # =====================================================
        tags["DUST2_FLOW"] = False
        tags["DESTONER_BLOWER_RUN"] = False
        tags["ALM_DESTONER_BLOCKED"] = False

        if (
            tags["DESTONER_RUN"]
            and tags["E4_RUN"]
            and tags["SW4"]
            and tags["BIN4_LEVEL"] > 0
        ):
            tags["DESTONER_BLOWER_RUN"] = True

            if tags["ALM_BIN5_FULL"]:
                tags["ALM_DESTONER_BLOCKED"] = True
            else:
                tags["BIN4_LEVEL"] -= DESTONER_RATE

                if random.random() < 0.75:
                    tags["BIN5_LEVEL"] += DESTONER_RATE
                else:
                    tags["DUST2_FLOW"] = True

        # =====================================================
        # BIN5 → HULLING
        # =====================================================
        if tags["HULLING_RUN"] and tags["BIN5_LEVEL"] > 0:
            tags["BIN5_LEVEL"] -= HULLING_RATE

        # =====================================================
        # GENERAL DUST LOSS
        # =====================================================
        tags["DUST3_FLOW"] = any(
            tags[f"E{i}_RUN"] for i in range(1, 5)
        ) and random.random() < 0.1

        # -------------------------
        # SCAN TIME
        # -------------------------
        time.sleep(1)
