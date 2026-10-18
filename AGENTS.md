<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the public Yahoo league source and parsing in a client-safe module, with upstream fetching in a server function; this keeps source validation testable and avoids browser cross-origin requests.
- Display only matchups and scores explicitly returned by the Yahoo league page, including its week and check timestamp; inaccessible or unrecognized responses must show an unavailable state, never fabricated scores.
- League content uses separate matchup-detail, standings, and activity routes with shared navigation; parse player fantasy-point columns separately from projections and preserve unplayed values as returned by Yahoo.
