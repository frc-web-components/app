use hyper::header::HeaderValue;
use hyper::service::{make_service_fn, service_fn};
use hyper::StatusCode;
use hyper::{Body, Request, Response, Server};
use std::convert::Infallible;
use std::path::Path;
use std::{fs};

mod plugins;

use crate::server::plugins::Config;

fn get_file_path<'a>(relative_path: &'a str, config: &'a mut Config) -> Option<String> {
    let asset_paths = config.get_asset_paths();
    for root_path in asset_paths {
        let full_path = Path::new(&root_path).join("assets").join(relative_path);
        
        if full_path.exists() {
            return full_path.to_str().map(|s| s.to_string());
        }
    }
    Some(String::from(""))
}

fn get_plugin_file_path<'a>(asset_index: usize, config: &'a mut Config) -> Option<String> {
    let asset_paths = config.get_asset_paths();
    let asset_path = asset_paths.get(asset_index);
    if let None = asset_path {
        return None;
    }
    let full_path = Path::new(&asset_path.unwrap()).join("index.js");
    if full_path.exists() {
        return full_path.to_str().map(|s| s.to_string());
    }
    None
}

fn get_content_type(file_path: &str) -> &'static str {
    let extname = Path::new(file_path).extension();
    if let None = extname {
        return "text/html";
    }
    match extname.unwrap().to_str().unwrap() {
        "js" => "text/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "png" => "image/png",
        "jpg" => "image/jpg",
        "wav" => "audio/wav",
        _ => "text/html",
    }
}

fn add_cors_headers(response: &mut Response<Body>) {
    response
        .headers_mut()
        .insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
    response.headers_mut().insert(
        "Access-Control-Allow-Methods",
        HeaderValue::from_static("GET, POST, OPTIONS, PUT, PATCH, DELETE"),
    );
    response.headers_mut().insert(
        "Access-Control-Allow-Headers",
        HeaderValue::from_static("X-Requested-With,content-type"),
    );
    response.headers_mut().insert(
        "Access-Control-Allow-Credentials",
        HeaderValue::from_static("true"),
    );
}

fn serve_file(file_path: &str, response: &mut Response<Body>) {
    if file_path == "" {
        *response.status_mut() = StatusCode::NOT_FOUND;
        *response.body_mut() = Body::from("");
        return;
    }
    let content_type = get_content_type(file_path);
    response
        .headers_mut()
        .insert("Content-Type", HeaderValue::from_static(content_type));
    // fs::read(path)
    match fs::read(Path::new(file_path)) {
        Ok(contents) => {
            *response.status_mut() = StatusCode::OK;
            *response.body_mut() = Body::from(contents);
        }
        Err(error) => {
            println!("error: {:?}", error);
            *response.status_mut() = StatusCode::NOT_FOUND;
            *response.body_mut() = Body::from("");
        }
    }
}

fn serve_static_asset(request: &Request<Body>, response: &mut Response<Body>, config: &mut Config) {
    let relative_path = &request.uri().to_string()[8..];
    let file_path = get_file_path(relative_path, config);
    match file_path {
        Some(path) => {
            serve_file(&path, response);
        }
        None => {
            *response.status_mut() = StatusCode::NOT_FOUND;
            *response.body_mut() = Body::from("");
        }
    }
}

fn serve_plugin(request: &Request<Body>, response: &mut Response<Body>, config: &mut Config) {
    let relative_path = &request.uri().to_string()[9..].parse::<usize>();
    if let Err(E) = relative_path {
        *response.status_mut() = StatusCode::NOT_FOUND;
        *response.body_mut() = Body::from("");
        return;
    }
    
    let plugin_index = relative_path.as_ref().unwrap();
    let file_path = get_plugin_file_path(*plugin_index, config);
    match file_path {
        Some(path) => {
            serve_file(&path, response);
        }
        None => {
            *response.status_mut() = StatusCode::NOT_FOUND;
            *response.body_mut() = Body::from("");
        }
    }
}

async fn hello(request: Request<Body>) -> Result<Response<Body>, Infallible> {
    let mut config: Config = Config::new();
    let mut response = Response::new(Body::from(""));
    add_cors_headers(&mut response);
    let uri = request.uri().to_string();
    if uri.starts_with("/assets/") {
        serve_static_asset(&request, &mut response, &mut config);
    } else if uri.starts_with("/plugins/") {
        serve_plugin(&request, &mut response, &mut config);
    } else {
        *response.status_mut() = StatusCode::NOT_FOUND;
        *response.body_mut() = Body::from("");
    }
    Ok(response)
}

pub async fn start_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = ([127, 0, 0, 1], 8125).into();

    let make_service = make_service_fn(|_| async { Ok::<_, Infallible>(service_fn(hello)) });

    let server = Server::bind(&addr).serve(make_service);

    println!("Listening on http://{}", addr);

    server.await?;

    Ok(())
}
