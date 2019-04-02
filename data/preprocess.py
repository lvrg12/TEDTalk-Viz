import csv
from geopy.geocoders import Nominatim

geolocator = Nominatim(timeout=15)
# location = geolocator.geocode("175 5th Avenue NYC")
# print(location.address)
# print((location.latitude, location.longitude))

locations_array = [['TED2018','Vancouver, BC, Canada'],['TEDWomen 2018','Palm Springs, California'],['TED2017','Vancouver, BC, Canada'],['TEDGlobal 2017','Arusha, Tanzania'],
['TEDWomen 2017','New Orleans, Louisiana'],['TEDWomen 2016','San Francisco, California'],['TEDSummit','Banff, AB, Canada'],['TED2016','Vancouver, BC, Canada'],
['TEDYouth 2015','New York, NY'],['TED Talks Live','New York, NY'],['TEDWomen 2015','Monterey, California'],['TED2015','Vancouver, BC, Canada'],
['TEDActive 2015','Whistler, BC, Canada'],['TEDYouth 2014','Brooklyn, New York'],['TEDGlobal 2014','Rio de Janeiro, Brazil'],['TEDSalon Berlin','Berlin, Germany'],
['TED2014','Vancouver, BC, Canada'],['TEDActive 2014','Whistler, BC, Canada'],['TEDWomen 2013','San Francisco, California'],['TEDYouth 2013','New Orleans, Louisiana'],
['TEDCity2.0 2013','New York, NY'],['TEDGlobal 2013','Edinburgh, Scotland'],['TEDActive 2013','Palm Springs, California'],['TED2013','Long Beach, California'],
['TEDYouth 2012','Manhattan, NY'],['TEDGlobal 2012','Edinburgh, Scotland'],['TEDActive 2012','Palm Springs, California'],['TED2012','Long Beach, California'],
['TEDYouth 2011','Manhattan, NY'],['TEDGlobal 2011','Edinburgh, Scotland'],['TEDActive 2011','Palm Springs, California'],['TED2011','Long Beach, California'],
['TEDWomen 2010','Washington, D.C.'],['TEDGlobal 2010','Oxford, UK'],['Mission Blue Voyage','Galápagos, Ecuador'],['TEDActive 2010','Palm Springs, California'],
['TED2010','Long Beach, California'],['TEDIndia','Mysore, India'],['TEDGlobal 2009','Oxford, UK'],['TED@PalmSprings','Palm Springs, California'],
['TED2009','Long Beach, California'],['TED@Aspen','Aspen, Colorado'],['TED2008','Monterey, California'],['TEDGlobal 2007','Arusha, Tanzania'],
['TED2007','Monterey, California'],['TED2006','Monterey, California'],['TEDGlobal 2005','Oxford, UK'],['TED2005','Monterey, California'],
['TED2004','Monterey, California'],['TED2003','Monterey, California'],['TED2002','Monterey, California'],['TED11','Monterey, California'],
['TED10','Monterey, California'],['TED9','Monterey, California'],['TED8','Monterey, California'],['TED7','Monterey, California'],['TED6','Monterey, California'],
['TED5','Monterey, California'],['TED4','Kobe, Japan'],['TED3','Monterey, California'],['TED2','Monterey, California'],['TED1','Monterey, California'],['TEDIndia 2009','Mysore, India'],
['TEDxParis 2010','Paris, France'],['TEDxParis 2012','Paris, France'],['TED@BCG Paris','Paris, France']]

loc = {}
coor = {}

for arr in locations_array:
    loc[arr[0]] = arr[1]

with open('data/tedmaintest.csv', newline='', encoding="utf8") as file1:
    with open('data/main.csv', 'w', newline='', encoding="utf8") as file2:
        reader = csv.reader(file1)
        writer = csv.writer(file2)

        count = 0
        for row in reader:
            count+=1

            if count == 1:
                row.append("location")
                row.append("coordinates")
                writer.writerow(row)
                continue

            
            if row[0] in loc:
                place = loc[row[0]]

                row.append(place)
                if place in coor:
                    coords = coor[place]
                else:
                    l = geolocator.geocode(place)
                    if l is None:
                        coords = "undefined"
                        coor[place] = "undefined"
                    else:
                        coords = str(l.latitude) + "," + str(l.longitude)
                        coor[place] = coords

            elif 'TEDx' in row[0]:

                place = row[0].split('TEDx')[1]
                if " " in place:
                    place = place.split(" ")[0]

                row.append(place)
                if place in coor:
                    coords = coor[place]
                else:
                    l = geolocator.geocode(place)
                    if l is None:
                        coords = "undefined"
                        coor[place] = "undefined"
                    else:
                        coords = str(l.latitude) + "," + str(l.longitude)
                        coor[place] = coords
                        
            else:
                row.append("undefined")
                coords = "undefined"

            row.append(coords)
            writer.writerow(row)

# print(loc)
