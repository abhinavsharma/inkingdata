import sys
import itertools
from string import capwords
import json
import random

MIN_FOR_CORRELATON = 100
NUM_TOP_SUBJECTS = 15

from itertools import imap

def pearsonr(x, y):
    # Assume len(x) == len(y)
    n = len(x)
    sum_x = float(sum(x))
    sum_y = float(sum(y))
    sum_x_sq = sum(map(lambda x: pow(x, 2), x))
    sum_y_sq = sum(map(lambda x: pow(x, 2), y))
    psum = sum(imap(lambda x, y: x * y, x, y))
    num = psum - (sum_x * sum_y/n)
    den = pow((sum_x_sq - pow(sum_x, 2) / n) * (sum_y_sq - pow(sum_y, 2) / n), 0.5)
    if den == 0: return 0
    return num / den


if __name__ == "__main__":
	subjects = {}
	students = {}
	for l in open(sys.argv[1]):
		l = l.strip("\r\n").split(',')
		if len(l) == 5 and not l[2].startswith("Result"):
			student_id = int(l[0])
			subject_id = int(l[1])
			subject_name = l[2]
			# Some subjects only have a letter grade and no score
			try:
				score = int(l[3])
			except:
				continue

			# {subject_id: subject_name} map
			if subject_id not in subjects:
				subjects[subject_id] = [subject_name, 1]
			else:
				subjects[subject_id][1] += 1

			# schema is {student_id: {subject_id : score}}
			if student_id not in students:
				students[student_id] = {}
			student = students[student_id]
			student[subject_id] = score

	

	top_subjects = sorted(subjects.keys(), key=lambda subid: subjects[subid][1], reverse=True)[:NUM_TOP_SUBJECTS]
	
	subject_names = open(sys.argv[3], 'w')
	subject_names.write('name,takers\n')
	for subject_id in top_subjects:
		subject_details = subjects[subject_id]
		subject_name = capwords(subject_details[0])
		subject_names.write(str(subject_name) + ',' + str(subject_details[1]) + '\n')
	subject_names.close()
	print "Dumped subject id-name,count mapping"


	pairs = set(itertools.combinations(
		top_subjects
		, 2))
	correlations = open(sys.argv[2], 'w')
	print "number of pairs of subjects: ",len(pairs)

	matrix = []
	for s1 in top_subjects:
		row = []
		for s2 in top_subjects:
			if s1 == s2:
				row.append(0.0);
			else:
				a1 = []
				a2 = []
				for (student_id, student_scores) in students.iteritems():
					if s1 in student_scores and s2 in student_scores:
						a1.append(student_scores[s1])
						a2.append(student_scores[s2])
				if len(a1) == len(a2) and len(a1) > MIN_FOR_CORRELATON:
					cor = pearsonr(a1, a2)
				else:
					cor = 0.0
				row.append(cor)
		matrix.append(row)
	correlations.write(json.dumps(matrix))
	correlations.close()


	

			



