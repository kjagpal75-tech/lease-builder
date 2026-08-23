with open('src/components/LeaseBuilder.tsx', 'r') as f:
    content = f.read()

replacements = [
    ('Truckee Donner PUD (Water)', 'Truckee Donner PUD (Water)'),
    ('Southwest Gas (Gas)', 'Southwest Gas (Gas)'),
    ('Tahoe Truckee Sierra Disposal (Trash)', 'Tahoe Truckee Sierra Disposal (Trash)'),
    ('Spectrum / AT&T (Internet)', 'Spectrum / AT&T (Internet)'),
    ('NV Energy (Electric)', 'NV Energy (Electric)'),
    ('Truckee Meadows Water Authority (Water)', 'Truckee Meadows Water Authority (Water)'),
    ('Waste Management (Trash)', 'Waste Management (Trash)'),
]

for name, _ in replacements:
    old = f'<input type="checkbox" className="mt-0.5" />\\n                          <div>\\n                            <span className="font-medium">{name}</span>'
    new = f'<input type="checkbox" className="mt-0.5" checked={{currentLease?.terms?.checkedUtilities?.includes(\\'{name}\\')}} onChange={{(e) => handleUtilityCheck(\\'{name}\\', e.target.checked)}} />\\n                          <div>\\n                            <span className="font-medium">{name}</span>'
    content = content.replace(old, new)

with open('src/components/LeaseBuilder.tsx', 'w') as f:
    f.write(content)
print('Bound all')