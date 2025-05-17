# ---
# jupyter:
#   jupytext:
#     formats: py:percent
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.16.4
#   kernelspec:
#     display_name: Python 3 (ipykernel)
#     language: python
#     name: python3
# ---

# %% [markdown]
# # Explorations
# Various tests of the API and the maths involved.

# %%
import math
import numpy as np
import requests as r
import matplotlib.pyplot as plt
import skimage.io
import io

# %%
with open(".env", "r") as f:
    env = {
        line.split("=")[0]: line.split("=")[1]
        for line in f.readlines()
    }
env

# %% [markdown]
# # Session

# %%
response = r.post(
    f"https://tile.googleapis.com/v1/createSession?key={env['API_KEY']}",
    json={
        "mapType": "streetview",
        "language": "en-US",
        "region": "US"
    }
)

# %%
json = response.json()
session = json["session"]
json

# %% [markdown]
# # Metadata

# %%
panoId = "bl3v0-ol5SonuMF_4ozgxQ"
response = r.get(f"https://tile.googleapis.com/v1/streetview/metadata?session={session}&key={env['API_KEY']}&panoId={panoId}")
response

# %%
metadata = response.json()
metadata

# %%
metadata["imageWidth"], metadata["tileWidth"], metadata["imageWidth"]/metadata["tileWidth"]

# %%
metadata["imageHeight"], metadata["tileHeight"], metadata["imageHeight"]/metadata["tileHeight"]

# %%
zoom = 2

tileWidth = metadata["tileWidth"]
tileHeight = metadata["tileHeight"]

imageWidth = metadata["imageWidth"]
imageHeight = metadata["imageHeight"]

cropWidth = imageWidth//2**(5-zoom)
cropHeight = imageHeight//2**(5-zoom)
cropWidth, cropHeight

# %%
nX = math.ceil(cropWidth/tileWidth)
nY = math.ceil(cropHeight/tileHeight)
rX = cropWidth % tileWidth or 512
rY = cropHeight % tileHeight or 512
nX, nY, rX, rY

# %% [markdown]
# # Getting tiles

# %%
response = r.get(
    f"https://tile.googleapis.com/v1/streetview/tiles/2/3/1?session={session}&key={env['API_KEY']}&panoId={panoId}"
)
response

# %%
image = skimage.io.imread(io.BytesIO(response.content))

# %%
plt.imshow(image)

# %%
images = []
for y in range(nY):
    images.append([])
    for x in range(nX):
        response = r.get(
            f"https://tile.googleapis.com/v1/streetview/tiles/2/{x}/{y}?session={session}&key={env['API_KEY']}&panoId={panoId}"
        )
        image = skimage.io.imread(io.BytesIO(response.content))
        images[-1].append(image)

# %%
f"https://tile.googleapis.com/v1/streetview/tiles/2/{x}/{y}?session={session}&key={env['API_KEY']}&panoId={panoId}"

# %%
fig, ax = plt.subplots(nY, nX)
for x in range(nX):
    for y in range(nY):
        image = images[y][x]
        if x == nX-1:
            image = image[:, :rX]
        if y == nY-1:
            image = image[:rY]
        ax[y, x].imshow(image)

# %% [markdown]
# # Constructing a sphere

# %%
# this much pi per tile horizontally
slice_h = 2*np.pi / (cropWidth/tileWidth)
slice_h

# %%
# this much pi per tile vertically
slice_v = np.pi / (cropHeight/tileHeight)
slice_v

# %% [markdown]
# Right, they're the same cause the tiles are squares.

# %%
x_angles = [slice_h*i for i in range(nX)]
x_angles.append(0.)
x_angles

# %%
y_angles = [slice_v*i for i in range(nY)]
y_angles.append(np.pi)
y_angles


# %%
def construct_sphere_slice(start_x, end_x, start_y, end_y):
    i_x = (end_x-start_x) / 0.26
    i_y = (end_y-start_y) / 0.26
