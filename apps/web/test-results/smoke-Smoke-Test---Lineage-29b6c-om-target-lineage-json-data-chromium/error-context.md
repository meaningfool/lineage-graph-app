# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - navigation [ref=e6]:
          - link "Home" [ref=e7] [cursor=pointer]:
            - /url: /
        - generic [ref=e8]:
          - button "Test File Upload" [ref=e9] [cursor=pointer]
          - button "Import CSV" [ref=e10] [cursor=pointer]:
            - img
            - text: Import CSV
          - button "Toggle theme" [ref=e11] [cursor=pointer]:
            - img
            - img
            - generic [ref=e12]: Toggle theme
      - separator [ref=e13]
    - generic [ref=e15]: No nodes to display
  - generic [ref=e16]:
    - img [ref=e18]
    - button "Open Tanstack query devtools" [ref=e66] [cursor=pointer]:
      - img [ref=e67]
  - region "Notifications alt+T"
  - alert [ref=e115]
  - button "Open Next.js Dev Tools" [ref=e121] [cursor=pointer]:
    - img [ref=e122]
```