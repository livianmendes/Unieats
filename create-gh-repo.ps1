$env:PATH = 'C:\Program Files\Git\cmd;' + $env:PATH
& 'C:\Program Files\GitHub CLI\gh.exe' repo create unieats --public --source . --remote origin --push
