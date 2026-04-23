# Dog Import

The Google Sheet at the provided URL has been normalized into:

- `/Users/sudlabha/Desktop/paw/data/pawjai-dogs.json`

Current snapshot:

- 55 dogs
- 6 rows with direct OneDrive photo URLs
- 14 rows flagged with `special_needs` based on medical/injury notes

## Import command

```bash
npm run import:dogs
```

## Required environment

The importer reads from `.env.local` and requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `PAWJAI_IMPORT_SHELTER_NAME`

If no shelter name is provided, the importer uses `The Voice Foundation`.

## Import behavior

- creates the shelter if it does not already exist by name
- upserts dogs by `(shelter_id, name)`
- stores aliases, caretaker names, and sheet photo captions in `dog_traits`
- stores direct OneDrive photo links in `dog_photos` using the external URL as both `storage_path` and `public_url`

## Shelter mapping

- shelter identity in Supabase: `The Voice Foundation`
- caretaker preserved from the spreadsheet: `สายทอง`

## Important note

This importer targets the hosted Supabase project and therefore should only be run with a service-role key. The public anon/publishable key is not sufficient for inserting dog records under the current RLS policies.
