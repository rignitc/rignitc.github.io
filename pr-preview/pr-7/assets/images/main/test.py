import requests
from apng import APNG
from PIL import Image

# Step 1: Download APNG file
url = "https://toolxox.com/site/api/uploads/toolxox.com-iconscout-4MYWc.webp"
apng_file = "404.webp"

print("Downloading APNG...")
response = requests.get(url, stream=True)
if response.status_code == 200:
    with open(apng_file, "wb") as f:
        f.write(response.content)
    print(f"Downloaded as {apng_file}")
else:
    raise Exception("Failed to download file, status code:", response.status_code)

# Step 2: Convert APNG ↗ GIF
print("Converting to GIF...")
apng = APNG.open(apng_file)

frames = []
durations = []

for i, (png, control) in enumerate(apng.frames):
    frame = Image.open(png)
    frames.append(frame.convert("RGBA"))
    durations.append(int(control.delay * 1000 / control.delay_den))  # ms

gif_file = "animated_image.gif"
frames[0].save(
    gif_file,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    disposal=2
)

print(f"Saved GIF as {gif_file}")
