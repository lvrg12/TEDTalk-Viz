import csv

with open('usable.csv', newline='') as file1:
    with open('main.csv', 'w', newline='') as file2:
        reader = csv.reader(file1)
        writer = csv.writer(file2)
        counter = 0
        r = []
        for row in reader:
            print(row)
            break