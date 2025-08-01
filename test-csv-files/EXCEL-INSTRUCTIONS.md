# 📊 Excel Integration Instructions

## Creating Your Own Test Files in Excel

All the `.csv` files in this directory can be opened and edited in Excel:

### ✅ **Opening CSV Files in Excel**
1. **Double-click** any `.csv` file → Opens in Excel
2. **Edit** the data as needed
3. **Save As** → Choose "CSV (Comma delimited)" format
4. **Use** the saved file for testing

### 📝 **Creating New Test Files in Excel**

#### For Nodes Files:
| Column A (id) | Column B (title) | Column C (type) |
|---------------|------------------|-----------------|
| users         | Users            | INPUT           |
| sessions      | Sessions         | INPUT           |
| conversion    | Conversion Rate  | STEP            |
| revenue       | Revenue          | OUTPUT          |

#### For Edges Files:
| Column A (source) | Column B (target) |
|-------------------|-------------------|
| users             | conversion        |
| sessions          | conversion        |
| conversion        | revenue           |

### ⚠️ **Excel Gotchas**
- **Always save as .csv** (not .xlsx)
- **Avoid special characters** in node IDs (use hyphens instead of spaces)
- **Check encoding**: Save as "CSV UTF-8" if you see strange characters

### 🎯 **Quick Excel Test Creation**

1. **Open Excel**
2. **Create nodes sheet**: Add columns `id`, `title`, `type`
3. **Create edges sheet**: Add columns `source`, `target`
4. **Save both as .csv files**
5. **Test in the app**!

### 📋 **Excel Template Data**

**Nodes Template:**
```
id,title,type
data-source,Data Source,INPUT
processor,Data Processor,STEP
final-output,Final Output,OUTPUT
```

**Edges Template:**
```
source,target
data-source,processor
processor,final-output
```

Copy-paste this into Excel, save as CSV, and you're ready to test!