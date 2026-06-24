import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def debug():
    print(f"Using DB: {settings.DATABASES['default']['ENGINE']}")
    print(f"Host: {settings.DATABASES['default'].get('HOST')}")

if __name__ == '__main__':
    debug()
