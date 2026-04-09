from pyicloud import PyiCloudService
import json, os

with open('icloud-credentials.json') as f:
    creds = json.load(f)

api = PyiCloudService(creds['apple_id'], creds['password'])
print('is_trusted:', api.is_trusted_session)

all_photos = api.photos.all
total = len(all_photos)
print('Total photos:', total)

outdir = os.path.join(os.path.expanduser('~'), 'Downloads', 'icloud-test')
os.makedirs(outdir, exist_ok=True)

# Get last 5 by index
for i in range(max(0, total - 5), total):
    p = all_photos[i]
    print('  [%d] %s (%s, %s)' % (i, p.filename, p.asset_date, p.item_type))
    data = p.download()
    if data:
        outpath = os.path.join(outdir, p.filename)
        with open(outpath, 'wb') as f:
            f.write(data)
        print('    Saved: %d bytes' % os.path.getsize(outpath))

print('Done!')
