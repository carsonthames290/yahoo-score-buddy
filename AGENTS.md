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

- Keep the public shared-matchup source and parsing in a client-safe module, with upstream fetching in a server function; this keeps source validation testable and avoids browser cross-origin requests.
- Show only scores actually returned by the public shared page, with its explicit week and a check timestamp; the share contract does not guarantee automatic week rollover or real-time updates.
