import asyncio
from pysus import PySUS

async def main():
    async with PySUS() as pysus:
        files = await pysus.query(dataset='sia', state='MA', year=2026, month=2)
        print([f.group for f in files])

asyncio.run(main())
