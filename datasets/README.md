# Dataset layout

- `examples/`: three original synthetic sample CSVs; schema examples only.
- `raw/`: original external downloads. Ignored by Git.
- `processed/`: validated experiment inputs and provenance reports. Ignored by Git.

See `../docs/KAGGLE_DATA_GUIDE.md` for download and preparation instructions.
The dashboard's sample tabs are also synthetic, hardcoded examples. No sample CSV
is loaded by the current model code. Personal predictions use database records.

The existing CSV export omits names and emails but retains linkable IDs and
free-text data. Treat exports as sensitive, not as anonymous public training data.
