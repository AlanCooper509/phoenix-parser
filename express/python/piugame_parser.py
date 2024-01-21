from bs4 import BeautifulSoup
from multiprocessing.pool import ThreadPool
import math
import json
import os
import requests
import sys
from datetime import date

lv = ''

def main():
    args = validateArgs()
    if args == None: return

    output = run(args["sid"], args["user"], args["outDir"])
    if output == None or not bool(output): return

    print(output)

def validateArgs():
    sid = None
    user = None
    outDir = "output"
    for arg in sys.argv:
        if not '=' in arg:
            continue
        key = arg.split('=')[0]
        value = arg.split('=')[1]
        if key == "sid":
            sid = value
            continue
        if key == "user":
            user = value
            continue
        if key == "outDir":
            outDir = value
            continue
    if sid == None:
        print("MISSING ARG: sid=SID", file=sys.stderr)
    if user == None:
        print("MISSING ARG: user=USER#NUM", file=sys.stderr)
    if sid == None or user == None:
        return None
    else:
        return {
            "sid": sid,
            "user": user,
            "outDir": outDir
        }

def run(sid, validator, outDir):
    output = {}
    info = None
    scorelist = None
    acquired_titles = None

    # debug toggles
    get_bestscores = True
    get_titles = True

    # player card
    info = getPlayerCard(sid)

    # ensure user#number matches expected input arg validator
    if not isValidInfo(info, validator): return output
    output["info"] = info

   # titles
    if get_titles:
        acquired_titles = getTitles(sid)
        output["titles"] = acquired_titles
 
    # best scores
    if get_bestscores:
        scorelist = parsePages(sid, lv)
        if scorelist == None: return
        output_formats = writeScoresFiles(scorelist, outDir)
        output["scores"] = output_formats

    # return JSON of output responses
    writeInfoJson(output, outDir)
    return json.dumps(output)

def isValidInfo(info, validator):
    if info == None:
        return False

    playerID = f'{info["player"]}{info["number"]}'
    if validator != playerID:
        print(f"Data retrieved for {playerID} does not match the expected player {validator}", file=sys.stderr)
        return False

    return True

def getPlayerCard(sid):
    html_doc = requests.get(f"https://www.piugame.com/my_page/title.php", headers={"Cookie": f"sid={sid}"})
    soup = BeautifulSoup(html_doc.text, 'html.parser')
    expired = soup.find("div", class_="loginQuick")
    if expired != None:
        print("The sid has expired or is invalid! Please log in again on piugame.com and verify your SID", file=sys.stderr)
        return None
    namecard = soup.find("div", class_="name_w")

    # get title name (with key: "text") and color (with value from class name: "col1...col6")
    t_soup = namecard.find("p", class_="t1")
    title = {
        "text": t_soup.text,
        "color": t_soup["class"][2]
    }
    name = namecard.find("p", class_="t2").text
    return {
        "player": name.split(" #")[0],
        "number": "#" + name.split(" #")[1],
        "title": title,
        "last_updated": date.today().strftime('%m/%d/%y')
    }

def parsePages(sid, lv):
    all_pages_data = []

    # Total Count of Best Plays on piugame Website
    total = getTotalCount(sid, lv)
    if total == 0 or total == None:
        return None

    last_page = math.ceil(total/6)
    args = [(sid, page_number, lv) for page_number in range(1, last_page + 1)]
    with ThreadPool() as pool:
        for page_data in pool.starmap(parsePage, args):
            all_pages_data += page_data
    return all_pages_data

def getTotalCount(sid, lv):
    html_doc = requests.get(f"https://www.piugame.com/my_page/my_best_score.php?lv={lv}", headers={"Cookie": f"sid={sid}"})
    soup = BeautifulSoup(html_doc.text, 'html.parser')
    expired = soup.find("div", class_="loginQuick")
    if expired != None:
        print("The sid has expired or is invalid! Please log in again on piugame.com and verify your SID", file=sys.stderr)
        return None
    total = int(soup.find("i", class_="tt t2").getText().replace(',', ''))
    return total

def parsePage(sid, pageNumber, lv):
    page_data = []
    page_of_plays = getPlays(sid, pageNumber, lv)
    for play in page_of_plays:
        play_data = parsePlay(play)
        page_data.append(play_data)
    return page_data

def getPlays(sid, pageNumber, lv):
    html_doc=requests.get(f"https://www.piugame.com/my_page/my_best_score.php?lv={lv}&page={pageNumber}", headers={"Cookie": f"sid={sid}"})
    soup = BeautifulSoup(html_doc.text, 'html.parser')
    list = soup.find("ul", class_="my_best_scoreList")
    page_of_plays = list.find_all("li", recursive=False)
    return page_of_plays

def parsePlay(play):
    chartDetails = getChartDetails(play)
    playDetails = getPlayDetails(play)
    return { **chartDetails,**playDetails }

def getChartDetails(play):
    def getChartSongName(play):
        songname = play.find("div", class_="song_name").find("p").text
        return songname
    def getChartType(stepball):
        return stepball.find("img")["src"].split('/')[-1].split('.')[0][0]
    def getChartLevel(stepball):
        images = stepball.find_all("img")
        left = images[1]["src"].split('/')[-1].split('.')[0][-1]
        right = images[2]["src"].split('/')[-1].split('.')[0][-1]
        return (left + right)

    stepball = play.find("div", class_="stepBall_in")
    song_name = getChartSongName(play)
    chart_type = getChartType(stepball)
    chart_level = getChartLevel(stepball)
    return {
        "name": song_name,
        "type": chart_type,
        "level": chart_level
    }

def getPlayDetails(play):
    def getPlayScore(score_container):
        return score_container.find("span").text
    def getPlayGrade(grade_container):
        return grade_container.find("img")["src"].split('/')[-1].split('.')[0]
    def getPlayPlate(plate_container):
        return plate_container.find("img")["src"].split('/')[-1].split('.')[0]

    play_stats = play.find("ul").find_all("li")
    play_score = getPlayScore(play_stats[0])
    play_grade = getPlayGrade(play_stats[1])
    play_plate = getPlayPlate(play_stats[2])
    return {
        "score": play_score,
        "grade": play_grade,
        "plate": play_plate
    }

def getTitles(sid):
    html_doc = requests.get(f"https://www.piugame.com/my_page/title.php", headers={"Cookie": f"sid={sid}"})
    soup = BeautifulSoup(html_doc.text, 'html.parser')
    entries = soup.find_all("li", class_="have")
    acquired_titles = []
    for entry in entries:
        acquired_titles.append(entry["data-name"])
    return acquired_titles

def writeScoresFiles(scorelist, outDir):
    outputFormats = formatScoresOutput(scorelist)

    jsonPath = f"{outDir}/best_scores.json"
    tsvPath = f"{outDir}/best_scores.tsv"
    csvPath = f"{outDir}/best_scores.csv"

    if not os.path.exists(outDir):
       os.makedirs(outDir)
    with open(jsonPath, 'w', encoding="utf-8") as f:
        f.write(outputFormats["json"])
    with open(tsvPath, 'w', encoding="utf-8") as f:
        f.writelines(outputFormats["tsv"])
    with open(csvPath, 'w', encoding="utf-8") as f:
        f.writelines(outputFormats["csv"])
    return {
        "json": jsonPath,
        "tsv": tsvPath,
        "csv": csvPath,
        "count": len(scorelist)
    }

def writeInfoJson(output, outDir):
    jsonPath = f"{outDir}/info.json"
    if not os.path.exists(outDir):
       os.makedirs(outDir)
    with open(jsonPath, 'w', encoding="utf-8") as f:
        f.write(json.dumps(output))
    return {
        "json": jsonPath
    }

def formatScoresOutput(scorelist):
    # as TSV file
    header = '\t'.join(["name", "type", "level", "score", "grade", "plate"])
    tablist = [header]
    for entry in scorelist:
        tablist.append(f'{entry["name"]}\t{entry["type"]}\t{entry["level"]}\t{entry["score"]}\t{entry["grade"]}\t{entry["plate"]}')
    tsvstring = '\n'.join(tablist)
    csvstring = tsvstring.replace('\t', ',')
    
    # as JSON array
    jsonlist = json.dumps(scorelist)

    return {
        "csv": csvstring,
        "tsv": tsvstring,
        "json": jsonlist
    }

if __name__ == '__main__':
    main()