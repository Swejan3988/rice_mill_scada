from flask import Flask, render_template, jsonify, abort
import threading
import dummy_plc
import json
import os

app = Flask(__name__)

# =========================
# LOAD TAG DEFINITIONS
# =========================
TAG_DEFS_PATH = os.path.join(os.path.dirname(__file__), "tag_definitions.json")

with open(TAG_DEFS_PATH) as f:
    TAG_DEFS = json.load(f)

# =========================
# ROUTES
# =========================

@app.route("/")
def home():
    return render_template("cleaning.html")

@app.route("/cleaning")
def cleaning():
    return render_template("cleaning.html")

@app.route("/hulling")
def hulling():
    return render_template("hulling.html")

@app.route("/whitening")
def whitening():
    return render_template("whitening.html")

@app.route("/polishing")
def polishing():
    return render_template("polishing.html")

@app.route("/sorting")
def sorting():
    return render_template("sorting.html")

# =========================
# TAG APIs
# =========================

@app.route("/tags")
def tags():
    """Live PLC tag values"""
    return jsonify(dummy_plc.tags)

@app.route("/tag-defs")
def tag_defs():
    """Official tag metadata"""
    return jsonify(TAG_DEFS)

@app.route("/toggle/<tag>")
def toggle(tag):
    """Allow toggle ONLY for READ_WRITE tags"""
    if tag not in TAG_DEFS:
        abort(404, "Unknown tag")

    if TAG_DEFS[tag].get("direction") != "READ_WRITE":
        abort(403, "Write not allowed for this tag")

    dummy_plc.tags[tag] = not dummy_plc.tags[tag]
    return jsonify({tag: dummy_plc.tags[tag]})

# =========================
# START PLC
# =========================

if __name__ == "__main__":
    threading.Thread(target=dummy_plc.plc_loop, daemon=True).start()
    app.run(debug=True)
