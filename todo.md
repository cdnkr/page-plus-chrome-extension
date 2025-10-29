NB
- [ ] Tools via structured
    - [ ] Code analyzer
    - [x] Fill form
    - [x] Color analyzer
    - [x] Get all page images
    ---
    - [ ] Write/reply
    - [ ] Proofread
    - [ ] Summarize
    - [ ] Translate
- [x] Page suggestions (unstable in Nano)
    - On the current page or a newly navigated to page, 
- [x] Default to using query tool
- [x] Page suggestions bugs (more passive)
    - Using flash for this by default fallback to default
    - The issue here is that it takes a long time to generate page suggestions with gemini nano using screenshot or content - tried mutiple strats - then when you do something like send a message or switch conversations it hangs because the thread is blocked (or someting to that effect)
    - the short-term plan is to use gemini flash - the fastest model for this 
    - If no network it will use default suggestions

- [x] Show associated contexts on related message in chat
- [x] MDX Component for Color analysis, Form filling and Get/Download Images
- [x] Voice input
- [ ] Summarize contexts on full with UI

Storage
- [x] Improve storage set up
- [x] Improve storage UI

Continuity
- [x] Ensure previous current messages are sent to ai
    - they are in the current session object by default
- [ ] Maybe summarize previous messages for context? (NTH)

Code 
- [x] Refactor at current

More contexts
- [x] Get html elements and their css in select area (for use in online models to get code for the element)
- [x] Get selection colours and also have a ontext key for this
- [x] Pass this along as context when in online model

Page agent interactions
- [x] Fill an input on the page based on input

Chat interactivity
- [ ] If querying about products, show them as special card? (mdx)

I18n
- [x] japanese and spanish

Hybrid
- [x] Create a web based useGemini hook for hybrid
- [x] Have a hybrid/select model switch on input
- [ ] API key input for gemini hybrid? Or route through fly.io api?

UI
- [ ] Dark mode
- [ ] Final polish
- [x] content.js CSS!

UX
- [x] Cmd/Ctrl + Enter = submit
- [x] Continuously scroll to bottom of chat when response is streaming in
- [x] Ttansparent overlay when selecting area to prevent clicks and remove on stop