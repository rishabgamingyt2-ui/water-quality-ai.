from flask import Flask, render_template, request
import numpy as np
import joblib

app = Flask(__name__)

# Load Model
model = joblib.load("model/water_quality_model.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    try:

        feature_order = [
            "aluminium",
            "ammonia",
            "arsenic",
            "barium",
            "cadmium",
            "chloramine",
            "chromium",
            "copper",
            "flouride",
            "bacteria",
            "viruses",
            "lead",
            "nitrates",
            "nitrites",
            "mercury",
            "perchlorate",
            "radium",
            "selenium",
            "silver",
            "uranium"
        ]

        features = []

        for feature in feature_order:
            value = request.form.get(feature)

            if value == "" or value is None:
                raise ValueError(f"{feature.title()} is required.")

            value = float(value)

            if value < 0:
                raise ValueError(f"{feature.title()} cannot be negative.")

            features.append(value)

        features = np.array(features).reshape(1, -1)

        prediction = model.predict(features)[0]

        probability = model.predict_proba(features)

        confidence = round(
            np.max(probability) * 100,
            2
        )

        if prediction == 1:

            prediction_text = "SAFE TO DRINK"

            status = "SAFE"

            color = "#22c55e"

            risk = "LOW"

            recommendation = (
                "Water quality appears safe for drinking."
            )

        else:

            prediction_text = "NOT SAFE TO DRINK"

            status = "UNSAFE"

            color = "#ef4444"

            risk = "HIGH"

            recommendation = (
                "Treat or filter the water before drinking."
            )

        return render_template(

            "index.html",

            prediction_text=prediction_text,

            confidence=confidence,

            status=status,

            risk=risk,

            recommendation=recommendation,

            color=color

        )

    except Exception as e:

        return render_template(

            "index.html",

            prediction_text=f"Error: {str(e)}"

        )


if __name__ == "__main__":
    app.run(debug=True)