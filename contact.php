<?php
error_reporting(0);

$blnSuccess = false;
$errors = array();

$name = "";
$email = "";
$content = "";

if(isset($_POST["btnSubmit"])){

    $string = "<p>";

    if(isset($_POST["name"]) && $_POST["name"] != ""){
        $name = htmlentities($_POST["name"], ENT_QUOTES, "UTF-8");
        $string .= "Name: ".$name."<br>";
    }

    if(isset($_POST["email"]) && $_POST["email"] != ""){
        if(!preg_match('/^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/', $_POST["email"])){
            $blnErrors = true;
            $errors[] = "Please fill in a valid email address.";
        }else{
            $email = $_POST["email"];
            $string .= "Email: ".htmlentities($email, ENT_QUOTES, "UTF-8")."<br>";
        }
    }else{
        $errors[] = "Please fill in an email address.";
    }

    if(isset($_POST["comment"]) && $_POST["comment"] != "" && $_POST["comment"] != "Leave your message here..."){
        $content = htmlentities($_POST["comment"], ENT_QUOTES, "UTF-8");
        $string .= "</p>Message:<br>".nl2br($content)."</p>";
    }else{
        $errors[] = "Please fill in a message.";
    }

    if(empty($errors)){
        $headers  = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type:text/html;charset=iso-8859-1' . "\r\n";
        $headers .= 'From:'.$email. "\r\n";
        if (mail("saranxdew@gmail.com", "Portfolio Contact", "<html><body>$string</body></html>", $headers)) {
            $blnSuccess = true;
            $name = "";
            $email = "";
            $content = "";
        } else {
            $errors[] = "I'm sorry, something went wrong. Please try again later.";
        }
    }

}

?>
<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="UTF-8">
    <title>Sven Van Dorst</title>
    <link href='http://fonts.googleapis.com/css?family=Open+Sans:400italic,400,600,700' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" type="text/css" href="assets/css/custom.css" />
    <script src="https://kit.fontawesome.com/7d485fd3d9.js" crossorigin="anonymous"></script>
    <meta name="keywords" content="Restauratie schilderijen, Stillevens, Realistische schilderkunst, Sven Van Dorst, Portret schilderen, Tentoonstellingen, Conservatie, olieverfschilderijen, Hedendaagse schilderkunst, Schoonmaken schilderijen, Technieken oude meesters, Fijnschilder, Restoration paintings, Still lifes, Realistic paintings, Portrait painting, Exhibitions, Conservation, Oil paintings, Contemporary art, Cleaning paintings, Old master techniques, restoration des tableaux, peinture realiste, nature morte" />
    <meta name="description" content="Sven Van Dorst is a Belgian paintings restorer and researcher, experienced in the cleaning, retouching and exhibiting of old master paintings. As a contemporary artist he is specialized in painting still life's and portraits in a realistic manner." />
</head>
<body>

<header>
    <ul id="menu">
        <li><a href="art.html">Art</a></li>
        <li><a href="restoration.html">Restoration</a></li>
        <li><a href="exhibitions.html">Exhibitions</a></li>
        <li><a href="interviews.html">Interviews</a></li>
        <li><a href="publications.html">Publications</a></li>
        <li><a href="bio.html">Biography</a></li>
        <li><a href="contact.php" class="active">Contact</a></li>
    </ul>
    <div class="clear"></div>
</header>

<div id="wrapper">

    <div id="container">

        <h3>My contact info</h3>

        <p>Active in Antwerp (BE) and Cambridge (UK)</p>
        <p class="social"><a class="blue" href="mailto:monetxiv@hotmail.com" target="_blank">Email</a>: <a href="mailto:monetxiv@hotmail.com" target="_blank"><i class="fas fa-envelope-square"></i></a></p>
        <p class="social"><a class="blue" href="https://www.linkedin.com/pub/sven-van-dorst/85/7b3/332" target="_blank">LinkedIn</a>: <a href="https://www.linkedin.com/pub/sven-van-dorst/85/7b3/332" target="_blank"><i class="fab fa-linkedin"></i></a></p>
        <p class="social"><a class="blue" href="https://www.facebook.com/Studio-Sven-Van-Dorst-751104745067818/" target="_blank">Facebook</a>: <a href="https://www.facebook.com/Studio-Sven-Van-Dorst-751104745067818/" target="_blank"><i class="fab fa-facebook-square"></i></a></p>
        <p class="social"><a class="blue" href="https://www.instagram.com/studiosvenvandorst/" target="_blank">Instagram</a>: <a href="https://www.instagram.com/studiosvenvandorst/" target="_blank"><i class="fab fa-instagram-square"></i></a></p>
        <p><a class="blue" href="https://privatearttours.be/" target="_blank">Private Art Tours</a></p>
        <p><a class="blue" href="https://phoebusfoundation.org/" target="_blank">Kunststichting - The Phoebus Foundation</a></p>

        <!--<form action="contact.php" method="post">

            <h3>Contact me</h3>

            <fieldset>

                <?php if(!empty($errors)){
                    echo '<ul class="errormessages">';
                    foreach($errors as $error){
                        echo '<li>'.$error.'</li>';
                    }
                    echo '</ul>';
                } ?>

                <?php if($blnSuccess){
                    echo '<p class="success">Thank you for contacting me.<br>
                    Your message has been sent successfully.</p>';
                }else{
                    echo <<< EOT
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" value="$name" />
                        <br />
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="$email" />
                        <br />
                        <label for="comment">Content</label>
                        <textarea placeholder="Leave your message here..." id="comment" name="comment">$content</textarea>
                        <br />

                        <input type="submit" value="Send" name="btnSubmit" />
EOT;
                } ?>


            </fieldset>
        </form>-->

    </div>

</div>

</body>
</html>