import joblib

model = joblib.load("model/water_quality_model.pkl")

print("Model Type:", type(model))
print(model)