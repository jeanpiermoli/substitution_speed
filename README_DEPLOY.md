Deploying this static site to GitHub Pages

Steps to publish:

1. Create a GitHub repository and push this project to it. If you don't have a repo yet:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

2. Ensure the workflow file `.github/workflows/deploy.yml` is present (already added).

3. The workflow uses `JamesIves/github-pages-deploy-action` to publish the repository root to the `gh-pages` branch automatically when you push to `main`.

4. After the first successful run (check Actions tab), enable GitHub Pages in repository Settings → Pages and select the `gh-pages` branch (if not automatic). The site will be available at `https://<your-username>.github.io/<repo-name>/`.

Notes:
- If you prefer a simpler approach, enable GitHub Pages from the `main` branch and the `/(root)` folder in Settings → Pages, or use `gh-pages` npm package locally.
- If your repo is private, enable Pages for private repos and ensure the action has permission to write pages (workflow sets permissions).

Optional: add a `CNAME` file to the root if you have a custom domain.
