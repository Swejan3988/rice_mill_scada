from flask import Flask, render_template, jsonify
import threading
import dummy_plc

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("cleaning.html")

@app.route("/tags")
def tags():
    return jsonify(dummy_plc.tags)

@app.route("/toggle/<tag>")
def toggle(tag):
    dummy_plc.tags[tag] = not dummy_plc.tags[tag]
    return jsonify({tag: dummy_plc.tags[tag]})

if __name__ == "__main__":
    threading.Thread(target=dummy_plc.plc_loop, daemon=True).start()
    app.run(debug=True)
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
