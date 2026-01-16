from flask import Flask, jsonify, request, render_template
from threading import Thread
from dummy_plc import plc_loop, tags

app = Flask(__name__)

# -------------------------
# MAIN PAGE
# -------------------------
@app.route("/")
def cleaning():
    return render_template("cleaning.html")

# -------------------------
# TAG API
# -------------------------
@app.route("/api/tags", methods=["GET", "POST"])
def api_tags():
    if request.method == "POST":
        data = request.json
        tag = data.get("tag")
        value = data.get("value")

        if tag in tags:
            tags[tag] = value
            return jsonify({"ok": True})

        return jsonify({"error": "Unknown tag"}), 400

    return jsonify(tags)

# -------------------------
# START PLC LOOP
# -------------------------
if __name__ == "__main__":
    Thread(target=plc_loop, daemon=True).start()
    app.run(debug=True)
