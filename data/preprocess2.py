import csv

with open('data/tedmaintest.csv', newline='', encoding="utf8") as file1:
    with open('data/main.csv', 'w', newline='', encoding="utf8") as file2:
        reader = csv.reader(file1)
        writer = csv.writer(file2)

        count = 0
        for row in reader:
            count+=1

            if count == 1:
                row.pop()
                row.append("lat")
                row.append("lon")
                writer.writerow(row)
            else:
                last = row.pop()
                if last == "undefined":
                    lat = 0
                    lon = 0
                else:
                    lat, lon = last.split(",")
                row.append(lat)
                row.append(lon)
                writer.writerow(row)

# print(loc)
