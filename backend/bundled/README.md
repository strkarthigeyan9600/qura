# Public dataset provenance

- Wisconsin Diagnostic Breast Cancer: bundled scikit-learn dataset (569 rows, 30 features).
- Heart Disease: UCI dataset 45, processed Cleveland file, 303 rows, 13 predictors. Binary target is original num > 0. Missing '?' values remain missing. https://archive.ics.uci.edu/dataset/45/heart+disease
- Parkinsons: UCI dataset 174, parkinsons.data, 195 recordings, 22 predictors. Removed voice identifier column 'name'; status renamed target. https://archive.ics.uci.edu/dataset/174/parkinsons

Downloaded on 3 October 2026 directly from UCI public dataset archives. These are public research datasets. Parkinsons contains repeated recordings per person; ordinary row-wise CV can be optimistic. It is included for workflow demonstration, not a valid independent-patient generalization study. Implement group-aware splitting before scientific claims on this benchmark.
