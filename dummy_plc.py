import time
import random

tags = {
    # COMMANDS
    "E1_CMD_START": False, "E1_CMD_STOP": False,
    "E2_CMD_START": False, "E2_CMD_STOP": False,
    "E3_CMD_START": False, "E3_CMD_STOP": False,
    "E4_CMD_START": False, "E4_CMD_STOP": False,

    # RUN FEEDBACK
    "E1_RUN": False, "E2_RUN": False,
    "E3_RUN": False, "E4_RUN": False,

    "CC1_RUN": False,
    "CLASSIFIER_RUN": False,
    "DESTONER_RUN": False,
    "HULLING_RUN": False,

    # SWITCHES
    "SW1": True, "SW2": True, "SW3": True, "SW4": True,

    # BINS
    "BIN1_LEVEL": 20,
    "BIN2_LEVEL": 20,
    "BIN3_LEVEL": 0,
    "BIN4_LEVEL": 0,
    "BIN5_LEVEL": 0,

    # FLOWS
    "DUST1_FLOW": False,
    "DUST2_FLOW": False,
    "DUST3_FLOW": False,
}

def handle_commands():
    for i in range(1, 5):
        if tags[f"E{i}_CMD_START"]:
            tags[f"E{i}_RUN"] = True
            tags[f"E{i}_CMD_START"] = False

        if tags[f"E{i}_CMD_STOP"]:
            tags[f"E{i}_RUN"] = False
            tags[f"E{i}_CMD_STOP"] = False

def process_material():
    if tags["E1_RUN"]:
        tags["BIN1_LEVEL"] = min(100, tags["BIN1_LEVEL"] + 1)
        tags["BIN2_LEVEL"] = min(100, tags["BIN2_LEVEL"] + 1)

    if tags["E2_RUN"] and tags["BIN1_LEVEL"] > 0:
        tags["BIN1_LEVEL"] -= 1
        tags["BIN3_LEVEL"] += 1

    if tags["E3_RUN"] and tags["BIN3_LEVEL"] > 0:
        tags["BIN3_LEVEL"] -= 1
        tags["BIN4_LEVEL"] += 1
        tags["DUST1_FLOW"] = random.random() < 0.3

    if tags["E4_RUN"] and tags["BIN4_LEVEL"] > 0:
        tags["BIN4_LEVEL"] -= 1
        tags["BIN5_LEVEL"] += 1
        tags["DUST2_FLOW"] = random.random() < 0.3

def plc_loop():
    while True:
        handle_commands()
        process_material()
        tags["DUST3_FLOW"] = any(tags[f"E{i}_RUN"] for i in range(1, 5))
        time.sleep(1)
