-- TABLA PARROQUIAS
CREATE TABLE parishes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  aka VARCHAR(100) DEFAULT NULL,
  locality VARCHAR(100) DEFAULT NULL,
  -- unico nombre y tag por parroquia
  UNIQUE KEY unique_name (name),
  UNIQUE KEY unique_tag (tag)
);

-- TABLA COMUNIDADES
CREATE TABLE communities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  number_community INT NOT NULL,
  parish_id INT NOT NULL,
  level_paso VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (parish_id) REFERENCES parishes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_community_per_parish (parish_id, number_community)
);

-- TABLA PERSONAS (todos los individuos, casados o solteros)
CREATE TABLE persons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  names VARCHAR(200) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  community_id INT NOT NULL,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_name_per_community (names, community_id)
);

-- TABLA MATRIMONIOS (relaciona dos personas)
CREATE TABLE marriages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person1_id INT NOT NULL,
  person2_id INT NOT NULL,
  community_id INT NOT NULL,
  marriage_date DATE DEFAULT NULL,
  FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_person1 (person1_id),
  UNIQUE KEY unique_person2 (person2_id),
  CHECK (person1_id < person2_id)
);

-- TABLA ROLES DE PERSONAS EN COMUNIDADES
CREATE TABLE person_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person_id INT NOT NULL,
  community_id INT NOT NULL,
  role ENUM('responsable', 'corresponsable', 'didascala', 'ostiario', 'catequista') NOT NULL,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_person_role_per_community (person_id, community_id, role)
);